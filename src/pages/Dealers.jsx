import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, ArrowLeft, Copy, Check, BarChart3, Link2, Power } from 'lucide-react';
import DealerStats from '@/components/dealers/DealerStats';

function genUid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'd-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Dealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', website: '', contact_name: '' });
  const [saving, setSaving] = useState(false);
  const [snippetFor, setSnippetFor] = useState(null);
  const [snippetTab, setSnippetTab] = useState('iframe');
  const [copied, setCopied] = useState(false);
  const [statsFor, setStatsFor] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Dealer.list('-created_date', 200);
    setDealers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.company_name.trim()) return;
    setSaving(true);
    const dealer = await base44.entities.Dealer.create({
      company_name: form.company_name.trim(),
      website: form.website.trim(),
      contact_name: form.contact_name.trim(),
      uid: genUid(),
      analytics_enabled: true
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-primary rounded-full" />
            <div>
              <h1 className="text-base font-bold text-gray-800">Виджеты и дилеры</h1>
              <p className="text-xs text-gray-400">Kermi Comfort — управление партнёрами и аналитика</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-800">
              ← Админка
            </button>
            <button onClick={() => navigate('/')} className="text-sm text-brand-green font-medium hover:underline">
              ← Виджет
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Add button / form */}
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
              <button onClick={handleAdd} disabled={saving || !form.company_name.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Сохранение...' : 'Создать'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{dealers.length} партнёр(ов) всего</p>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:bg-primary-dark transition-colors">
              <Plus size={16} />
              Добавить виджет
            </button>
          </div>
        )}

        {/* Dealers list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
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
                  <th className="text-left px-4 py-3 font-medium">UID</th>
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
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{d.uid?.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleAnalytics(d)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          d.analytics_enabled !== false
                            ? 'bg-brand-green/10 text-brand-green'
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
                        <button onClick={() => setStatsFor(d)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary-light text-foreground hover:bg-primary/20">
                          <BarChart3 size={13} /> Статистика
                        </button>
                        <button onClick={() => setSnippetFor(d)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-green/10 text-brand-green hover:bg-brand-green/20">
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

        {/* Stats panel */}
        {statsFor && (
          <DealerStats dealer={statsFor} onClose={() => setStatsFor(null)} />
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
                onClick={() => { setSnippetTab('iframe'); setCopied(false); }}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  snippetTab === 'iframe' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Код виджета
              </button>
              <button
                onClick={() => { setSnippetTab('listener'); setCopied(false); }}
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
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Скопировано' : 'Скопировать код'}
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