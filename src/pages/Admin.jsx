import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('price_list');
  const [status, setStatus] = useState(null);
  const [radiatorCount, setRadiatorCount] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [uploadList, radCount] = await Promise.all([
      base44.entities.DataUpload.list('-created_date', 20),
      base44.entities.Radiator.list('-created_date', 1)
    ]);
    setUploads(uploadList);
    // count all by paginating with offset
    let total = 0, page = 0;
    while (true) {
      const batch = await base44.entities.Radiator.list('article', 500, 500 * page);
      total += batch.length;
      if (batch.length < 500) break;
      page++;
    }
    setRadiatorCount(total);
  };

  const parseAndImportExcel = async (file, type) => {
    setUploading(true);
    setStatus({ type: 'loading', message: 'Загрузка и парсинг файла...' });

    const uploadRecord = await base44.entities.DataUpload.create({
      filename: file.name,
      upload_type: type,
      status: 'processing'
    });

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStatus({ type: 'loading', message: 'Парсинг Excel и загрузка в базу...' });

      // Call backend function that parses xlsx directly (no flaky AI extraction)
      const resp = await base44.functions.invoke('parseRadiatorsExcel', {
        file_url,
        upload_type: type,
        upload_record_id: uploadRecord.id
      });

      const result = resp.data;

      if (result.status !== 'success') {
        throw new Error(result.details || 'Не удалось обработать файл');
      }

      setStatus({ type: 'success', message: `Успешно загружено ${result.records_count} позиций!` });
      await loadData();

    } catch (err) {
      await base44.entities.DataUpload.update(uploadRecord.id, {
        status: 'error',
        error_message: err.message
      });
      setStatus({ type: 'error', message: `Ошибка: ${err.message}` });
    }
    setUploading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseAndImportExcel(file, uploadType);
    }
  };

  const clearAllRadiators = async () => {
    if (!window.confirm('Удалить все радиаторы из базы данных? Это действие необратимо.')) return;
    setStatus({ type: 'loading', message: 'Очистка базы данных...' });
    await base44.entities.Radiator.deleteMany({});
    setStatus({ type: 'success', message: 'База данных очищена.' });
    await loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-teal-500 rounded-full" />
            <div>
              <h1 className="text-base font-bold text-gray-800">Панель администратора</h1>
              <p className="text-xs text-gray-400">Kermi Comfort — управление данными</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-teal-600 font-medium hover:underline"
          >
            ← Открыть виджет
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Радиаторов в базе</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{radiatorCount ?? '—'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Загрузок файлов</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{uploads.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Последнее обновление</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {uploads[0]?.created_date
                ? new Date(uploads[0].created_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Нет данных'}
            </p>
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">Загрузить Excel-файл</h2>

          {/* Upload type selector */}
          <div className="flex gap-3 mb-5">
            {[
              { id: 'price_list', label: 'Прайс-лист с артикулами' },
              { id: 'calculator', label: 'Калькулятор теплоотдачи' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setUploadType(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  uploadType === t.id
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
              uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-teal-400 hover:bg-teal-50'
            }`}
          >
            {uploading ? (
              <Loader2 size={32} className="text-teal-400 animate-spin" />
            ) : (
              <FileSpreadsheet size={32} className="text-gray-300" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {uploading ? 'Обработка...' : 'Нажмите для выбора файла'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Поддерживаются файлы .xlsx, .xls</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Status message */}
          {status && (
            <div className={`mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-sm ${
              status.type === 'success' ? 'bg-green-50 text-green-700' :
              status.type === 'error' ? 'bg-red-50 text-red-700' :
              'bg-teal-50 text-teal-700'
            }`}>
              {status.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> :
               status.type === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> :
               <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-3">Инструкция по загрузке</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Выберите тип файла: <strong>Прайс-лист</strong> — основной файл с артикулами и характеристиками (20262304261.xlsx).</p>
            <p>2. Нажмите на область загрузки и выберите файл формата .xlsx.</p>
            <p>3. Система автоматически распознает типы радиаторов по артикулам (FK0, FTU, PK0, PTV).</p>
            <p>4. После загрузки новых данных рекомендуется очистить базу перед повторной загрузкой.</p>
          </div>
        </div>

        {/* Clear database */}
        <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-2">Опасная зона</h2>
          <p className="text-sm text-gray-500 mb-4">Полная очистка базы данных радиаторов. Действие необратимо.</p>
          <button
            onClick={clearAllRadiators}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
            Очистить базу данных
          </button>
        </div>

        {/* Upload history */}
        {uploads.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-800">История загрузок</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {uploads.map(u => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {u.status === 'success' ? <CheckCircle size={16} className="text-green-500" /> :
                     u.status === 'error' ? <AlertCircle size={16} className="text-red-400" /> :
                     <Loader2 size={16} className="text-teal-400 animate-spin" />}
                    <div>
                      <p className="text-sm font-medium text-gray-700">{u.filename}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(u.created_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {u.records_count ? ` · ${u.records_count} записей` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.status === 'success' ? 'bg-green-100 text-green-700' :
                    u.status === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {u.status === 'success' ? 'Успешно' : u.status === 'error' ? 'Ошибка' : 'В процессе'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}