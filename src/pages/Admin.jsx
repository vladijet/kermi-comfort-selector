import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2,
  Plus, Copy, Check, BarChart3, Link2, Power, ToggleLeft, ToggleRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DealerStats from '@/components/dealers/DealerStats';

function genUid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'd-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('radiators');

  // ─── Auth guard ───────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user || user.role !== 'admin') {
        navigate('/');
      } else {
        setAuthChecked(true);
      }
    }).catch(() => navigate('/'));
  }, []);

  // ─── Radiators state ─────────────────────────────────────────
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('price_list');
  const [status, setStatus] = useState(null);
  const [radiatorCount, setRadiatorCount] = useState(null);
  const fileInputRef = useRef();

  // ─── Dealers state ────────────────────────────────────────────
  const [dealers, setDealers] = useState([]);
  const [dealersLoading, setDealersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', website: '', contact_name: '' });
  const [saving, setSaving] = useState(false);
  const [snippetFor, setSnippetFor] = useState(null);
  const [snippetTab, setSnippetTab] = useState('iframe');
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [statsFor, setStatsFor] = useState(null);

  useEffect(() => {
    if (!authChecked) return;
    loadRadiators();
    loadDealers();
  }, [authChecked]);

  // ─── Radiator methods ─────────────────────────────────────────
  const loadRadiators = async () => {
    const [uploadList] = await Promise.all([
      base44.entities.DataUpload.list('-created_date', 20)
    ]);
    setUploads(uploadList);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStatus({ type: 'loading', message: 'Парсинг Excel и загрузка в базу...' });
      const resp = await base44.functions.invoke('parseRadiatorsExcel', {
        file_url,
        upload_type: type,
        upload_record_id: uploadRecord.id
      });
      const result = resp.data;
      if (result.status !== 'success') {
        let msg = result.details || 'Не удалось обработать файл';
        if (result.debug && result.debug.headers) {
          msg += ` (заголовки: ${result.debug.headers.join(', ')})`;
        }
        throw new Error(msg);
      }
      if (result.records_count === 0) throw new Error('Файл обработан, но не найдено строк с артикулом');
      setStatus({ type: 'success', message: `Успешно загружено ${result.records_count} позиций!` });
      await loadRadiators();
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
    if (file) parseAndImportExcel(file, uploadType);
  };

  const clearAllRadiators = async () => {
    if (!window.confirm('Удалить все радиаторы из базы данных? Это действие необратимо.')) return;
    setStatus({ type: 'loading', message: 'Очистка базы данных...' });
    await base44.entities.Radiator.deleteMany({});
    setStatus({ type: 'success', message: 'База данных очищена.' });
    await loadRadiators();
  };

  // ─── Dealer methods ───────────────────────────────────────────
  const loadDealers = async () => {
    setDealersLoading(true);
    const data = await base44.entities.Dealer.list('-created_date', 200);
    setDealers(data);
    setDealersLoading(false);
  };

  const handleAddDealer = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    const dealer = await base44.entities.Dealer.create({
      company_name: form.company_name.trim(),
      website: form.website.trim(),
      contact_name: form.contact_name.trim(),
      uid: genUid(),
      analytics_enabled: true,
      is_active: true
    });
    setDealers(prev => [dealer, ...prev]);
    setForm({ company_name: '', website: '', contact_name: '' });
    setShowForm(false);
    setSaving(false);
  };

  const toggleAnalytics = async (d) => {
    await base44.entities.Dealer.update(d.id, { analytics_enabled: !d.analytics_enabled });
    setDealers(prev => prev.map(x => x.id === d.id ? { ...x, analytics_enabled: !x.analytics_enabled } : x));
  };

  const toggleActive = async (d) => {
    const next = d.is_active === false ? true : false;
    await base44.entities.Dealer.update(d.id, { is_active: next });
    setDealers(prev => prev.map(x => x.id === d.id ? { ...x, is_active: next } : x));
  };

  const buildSnippet = (uid) => {
    const origin = window.location.origin;
    return `<iframe src="${origin}/embed?uid=${uid}" style="width:100%;height:600px;border:0;display:block;max-width:1100px;margin:0 auto;" title="Kermi Comfort — подбор радиаторов"></iframe>`;
  };

  const buildListenerScript = (uid) => {
    return `<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'setIframeHeight') {
    var iframe = document.querySelector('iframe[src*="uid=${uid}"]');
    if (iframe) iframe.style.height = e.data.height + 'px';
  }
});
</script>`;
  };

  const copySnippet = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
    });
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-primary rounded-full" />
            <div>
              <h1 className="text-base font-bold text-gray-800">Панель администратора</h1>
              <p className="text-xs text-gray-400">Kermi Comfort — управление данными и партнёрами</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-brand-green font-medium hover:underline"
          >
            ← Открыть виджет
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 border-b border-gray-100 -mb-px">
            {[
              { id: 'radiators', label: 'База радиаторов' },
              { id: 'dealers', label: 'Виджеты и партнёры' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ═══ TAB: RADIATORS ═══════════════════════════════════ */}
        {tab === 'radiators' && (
          <>
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
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  uploading ? 'border-border bg-secondary cursor-not-allowed' : 'border-border hover:border-primary hover:bg-primary-light'
                }`}
              >
                {uploading ? <Loader2 size={32} className="text-primary animate-spin" /> : <FileSpreadsheet size={32} className="text-gray-300" />}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">{uploading ? 'Обработка...' : 'Нажмите для выбора файла'}</p>
                  <p className="text-xs text-gray-400 mt-1">Поддерживаются файлы .xlsx, .xls</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              {status && (
                <div className={`mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-sm ${
                  status.type === 'success' ? 'bg-brand-green/10 text-brand-green' :
                  status.type === 'error' ? 'bg-brand-red/10 text-brand-red' :
                  'bg-primary-light text-foreground'
                }`}>
                  {status.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> :
                   status.type === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-red" /> :
                   <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-primary" />}
                  <span>{status.message}</span>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-2xl border border-brand-red/30 p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground mb-2">Опасная зона</h2>
              <p className="text-sm text-muted-foreground mb-4">Полная очистка базы данных радиаторов. Действие необратимо.</p>
              <button
                onClick={clearAllRadiators}
                className="flex items-center gap-2 px-4 py-2 bg-brand-red/10 text-brand-red border border-brand-red/40 rounded-lg text-sm font-medium hover:bg-brand-red/20 transition-colors"
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
                        {u.status === 'success' ? <CheckCircle size={16} className="text-brand-green" /> :
                         u.status === 'error' ? <AlertCircle size={16} className="text-brand-red/70" /> :
                         <Loader2 size={16} className="text-primary animate-spin" />}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{u.filename}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(u.created_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {u.records_count ? ` · ${u.records_count} записей` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.status === 'success' ? 'bg-brand-green/10 text-brand-green' :
                        u.status === 'error' ? 'bg-brand-red/10 text-brand-red' :
                        'bg-primary-light text-foreground'
                      }`}>
                        {u.status === 'success' ? 'Успешно' : u.status === 'error' ? 'Ошибка' : 'В процессе'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ TAB: DEALERS ═════════════════════════════════════ */}
        {tab === 'dealers' && (
          <>
            {/* Add form / button */}
            {showForm ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-gray-800">Новый партнёр</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={form.company_name}
                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Название компании"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                  <input
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    placeholder="Сайт (example.com)"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                  <input
                    value={form.contact_name}
                    onChange={e => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="Контактное лицо"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDealer}
                    disabled={saving || !form.company_name.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Сохранение...' : 'Создать'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{dealers.length} партнёр(ов) всего</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} />
                  Добавить виджет
                </button>
              </div>
            )}

            {/* Dealers table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {dealersLoading ? (
                <div className="p-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary-light border-t-primary rounded-full animate-spin" />
                </div>
              ) : dealers.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">
                  Нет партнёров. Нажмите «Добавить виджет», чтобы создать первый.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Компания</th>
                      <th className="text-left px-4 py-3 font-medium">Сайт</th>
                      <th className="text-left px-4 py-3 font-medium">Контакт</th>
                      <th className="text-left px-4 py-3 font-medium">Создан</th>
                      <th className="text-center px-4 py-3 font-medium">Статус</th>
                      <th className="text-center px-4 py-3 font-medium">Аналитика</th>
                      <th className="text-right px-6 py-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dealers.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{d.company_name}</td>
                        <td className="px-4 py-3 text-gray-600">{d.website || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{d.contact_name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(d.created_date)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleActive(d)}
                            title="Включить/выключить виджет"
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              d.is_active !== false
                                ? 'bg-brand-green/10 text-brand-green'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {d.is_active !== false
                              ? <ToggleRight size={13} />
                              : <ToggleLeft size={13} />
                            }
                            {d.is_active !== false ? 'Активен' : 'Выключен'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleAnalytics(d)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              d.analytics_enabled !== false
                                ? 'bg-primary/10 text-primary-foreground bg-primary'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title="Включить/выключить сбор аналитики"
                          >
                            <Power size={12} />
                            {d.analytics_enabled !== false ? 'Вкл' : 'Выкл'}
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setStatsFor(statsFor?.id === d.id ? null : d)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                statsFor?.id === d.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-primary-light text-foreground hover:bg-primary/20'
                              }`}
                            >
                              <BarChart3 size={13} /> Статистика
                            </button>
                            <button
                              onClick={() => setSnippetFor(d)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                            >
                              <Link2 size={13} /> Код
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Inline stats panel */}
            {statsFor && (
              <DealerStats dealer={statsFor} onClose={() => setStatsFor(null)} />
            )}
          </>
        )}
      </div>

      {/* Snippet modal */}
      {snippetFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSnippetFor(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Link2 size={16} className="text-brand-green" />
              <h3 className="text-base font-bold text-gray-800">Код для установки</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Передайте эти коды партнёру «{snippetFor.company_name}». Оба блока вставляются в HTML страницы.
            </p>
            {/* Tabs */}
            <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => { setSnippetTab('iframe'); setSnippetCopied(false); }}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  snippetTab === 'iframe' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Код виджета
              </button>
              <button
                onClick={() => { setSnippetTab('listener'); setSnippetCopied(false); }}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  snippetTab === 'listener' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Скрипт автовысоты
              </button>
            </div>
            <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
{snippetTab === 'iframe' ? buildSnippet(snippetFor.uid) : buildListenerScript(snippetFor.uid)}
            </pre>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => copySnippet(snippetTab === 'iframe' ? buildSnippet(snippetFor.uid) : buildListenerScript(snippetFor.uid))}
                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                {snippetCopied ? <Check size={14} /> : <Copy size={14} />}
                {snippetCopied ? 'Скопировано' : 'Скопировать код'}
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-1">Краткая инструкция для партнёра</p>
              <ol className="text-xs text-gray-500 list-decimal list-inside space-y-1">
                <li>«Код виджета» вставьте в HTML там, где должен отображаться калькулятор.</li>
                <li>«Скрипт автовысоты» вставьте перед закрывающим тегом <code className="font-mono bg-gray-100 px-1 rounded">&lt;/body&gt;</code> — он подгонит высоту iframe под контент.</li>
                <li>Сохраните и опубликуйте страницу.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}