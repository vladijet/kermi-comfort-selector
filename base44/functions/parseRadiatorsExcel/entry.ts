import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

// Parse uploaded Excel file and create Radiator records directly on the server.
// Handles numbers with comma decimal separators and any cell formatting.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body.file_url;
    const uploadRecordId = body.upload_record_id;

    if (!fileUrl) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Fetch the uploaded xlsx file
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) {
      return Response.json({ error: `Failed to fetch file: ${fileResp.status}` }, { status: 502 });
    }
    const ab = await fileResp.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(ab), { type: 'array' });

    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    // Read as text to avoid Excel locale number issues, then parse ourselves
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

    if (!rows || !rows.length) {
      if (uploadRecordId) {
        await base44.entities.DataUpload.update(uploadRecordId, {
          status: 'error',
          error_message: 'Файл не содержит распознанных записей'
        });
      }
      return Response.json({ status: 'error', details: 'Файл не содержит распознанных записей', records_count: 0 });
    }

    // Robust number parser: handles "48,5", "48.5", 48.5, " 1,28 ", etc.
    const num = (v) => {
      if (v === null || v === undefined || v === '') return null;
      if (typeof v === 'number') return isNaN(v) ? null : v;
      let s = String(v).trim().replace(/\s/g, '').replace(/\u00A0/g, '');
      // remove thousands separators if any (e.g. "1.234,56" -> "1234,56")
      s = s.replace(/\.(?=\d{3}(\D|$))/g, '');
      s = s.replace(',', '.');
      s = s.replace(/[^0-9.\-]/g, '');
      if (s === '' || s === '-' || s === '.') return null;
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };

    // Case-insensitive field lookup with fallbacks
    const pick = (r, keys) => {
      if (!r) return null;
      const lowerMap = {};
      for (const k of Object.keys(r)) lowerMap[k.toLowerCase().trim()] = r[k];
      for (const k of keys) {
        const val = lowerMap[k.toLowerCase().trim()];
        if (val !== null && val !== undefined && val !== '') return val;
      }
      return null;
    };

    const processedRecords = rows
      .map((r) => {
        const articleRaw = pick(r, ['article', 'артикул', 'art', 'article_code']);
        if (!articleRaw) return null;
        const art = String(articleRaw).trim();

        let series = 'profil';
        let connection_type = 'FK0';
        if (art.startsWith('PK0')) { series = 'plan'; connection_type = 'PK0'; }
        else if (art.startsWith('PTV')) { series = 'plan'; connection_type = 'PTV'; }
        else if (art.startsWith('FTU')) { series = 'profil'; connection_type = 'FTU'; }
        else if (art.startsWith('FTV')) { series = 'profil'; connection_type = 'FTV'; }
        else if (art.startsWith('FK0')) { series = 'profil'; connection_type = 'FK0'; }

        const typeFromRow = pick(r, ['type', 'тип', 'radiator_type']);
        const typeMatch = art.match(/^[A-Z]+\d*(\d{2})/);
        const radiator_type = num(typeFromRow) ?? (typeMatch ? parseInt(typeMatch[1], 10) : null);

        return {
          article: art,
          description_ru: pick(r, ['description_ru', 'описание', 'description']) || '',
          description_en: pick(r, ['description_en']) || '',
          series,
          connection_type,
          radiator_type,
          height: num(pick(r, ['height_mm', 'height', 'высота'])),
          length: num(pick(r, ['length_mm', 'length', 'длина'])),
          depth: num(pick(r, ['depth_mm', 'depth', 'глубина'])),
          heat_output_dt70: num(pick(r, ['heat_output_dt70_w', 'heat_output_dt70', 'теплоотдача'])),
          n_exponent: num(pick(r, ['n_exponent', 'n'])) ?? 1.28,
          weight_net: num(pick(r, ['net_weight_kg', 'weight_net', 'вес_нетто'])),
          weight_gross: num(pick(r, ['gross_weight_kg', 'weight_gross', 'вес_брутто'])),
          volume: num(pick(r, ['coolant_volume_l', 'volume', 'объем'])),
          price: num(pick(r, ['price', 'цена']))
        };
      })
      .filter(Boolean);

    if (!processedRecords.length) {
      if (uploadRecordId) {
        await base44.entities.DataUpload.update(uploadRecordId, {
          status: 'error',
          error_message: 'Не найдено строк с артикулом'
        });
      }
      return Response.json({
        status: 'error',
        details: 'Не найдено строк с артикулом',
        records_count: 0,
        debug: { totalRows: rows.length, headers: Object.keys(rows[0]), firstRow: rows[0] }
      });
    }

    // Bulk create in batches of 100
    const BATCH = 100;
    for (let i = 0; i < processedRecords.length; i += BATCH) {
      const batch = processedRecords.slice(i, i + BATCH);
      await base44.entities.Radiator.bulkCreate(batch);
    }

    if (uploadRecordId) {
      await base44.entities.DataUpload.update(uploadRecordId, {
        status: 'success',
        records_count: processedRecords.length,
        file_url: fileUrl
      });
    }

    return Response.json({
      status: 'success',
      records_count: processedRecords.length,
      sample: processedRecords[0]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});