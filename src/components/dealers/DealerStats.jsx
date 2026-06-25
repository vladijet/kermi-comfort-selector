import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Users, Eye, MousePointerClick, Copy } from 'lucide-react';

const RANGES = [
  { id: 'today', label: 'Сегодня', days: 1 },
  { id: 'week', label: 'Неделя', days: 7 },
  { id: 'month', label: 'Месяц', days: 30 },
  { id: 'all', label: 'Всё время', days: null }
];

export default function DealerStats({ dealer, onClose }) {
  const [range, setRange] = useState('month');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.WidgetEvent.filter({ dealer_uid: dealer.uid }, '-created_date', 5000)
      .then(data => { if (active) { setEvents(data || []); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dealer.uid]);

  const since = range === 'all' ? null : (() => {
    const d = new Date();
    d.setDate(d.getDate() - (RANGES.find(r => r.id === range).days - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const filtered = events.filter(e =>
    !since || new Date(e.created_date) >= since
  );

  const opened = filtered.filter(e => e.event_type === 'widget_opened');
  const calculated = filtered.filter(e => e.event_type === 'calculation_performed');
  const copied = filtered.filter(e => e.event_type === 'article_copied');
  const uniqueVisitors = new Set(filtered.map(e => e.visitor_id).filter(Boolean)).size;

  const fmtPct = (n, base) => base ? `${((n / base) * 100).toFixed(0)}%` : '—';

  const cards = [
    { label: 'Открытия', value: opened.length, icon: Eye, color: 'text-gray-600' },
    { label: 'Подборы', value: calculated.length, icon: MousePointerClick, color: 'text-primary' },
    { label: 'Копирования', value: copied.length, icon: Copy, color: 'text-brand-green' },
    { label: 'Уник. посетители', value: uniqueVisitors, icon: Users, color: 'text-kermi-heat' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <h2 className="text-base font-bold text-gray-800">Статистика — {dealer.company_name}</h2>
          <p className="text-xs text-gray-400">Воронка использования виджета</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      {/* Range selector */}
      <div className="px-6 py-3 flex items-center gap-2 border-b border-gray-50">
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === r.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-muted'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">
          {dealer.analytics_enabled === false ? 'Аналитика отключена' : 'Аналитика включена'}
        </span>
      </div>

      {/* Cards */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : !dealer.analytics_enabled ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Сбор аналитики для этого партнёра отключён. Включите её в таблице, чтобы видеть данные.
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Нет событий за выбранный период.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cards.map(c => (
                <div key={c.label} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <c.icon size={14} className={c.color} />
                    {c.label}
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{c.value}</p>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Конверсия воронки</p>
              <FunnelRow label="Открытия" count={opened.length} pct="100%" tone="bg-gray-400" />
              <FunnelRow label="Перешли к подбору" count={calculated.length} pct={fmtPct(calculated.length, opened.length)} tone="bg-primary" />
              <FunnelRow label="Скопировали артикул" count={copied.length} pct={fmtPct(copied.length, opened.length)} tone="bg-brand-green" last />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FunnelRow({ label, count, pct, tone, last }) {
  return (
    <div className={`flex items-center gap-3 ${last ? '' : 'mb-2'}`}>
      <span className="text-sm text-gray-600 w-44 truncate">{label}</span>
      <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden">
        <div className={`h-full ${tone} opacity-80 rounded-lg`} style={{ width: pct === '—' ? '0%' : pct }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-12 text-right">{count}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct}</span>
    </div>
  );
}