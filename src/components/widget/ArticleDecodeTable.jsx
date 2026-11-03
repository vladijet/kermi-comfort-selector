import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { SERIES, CONNECTION_LABELS, getMountingInfo } from '@/lib/radiatorData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const has = (v) => v !== null && v !== undefined && v !== '';
const HEADERS = ['Параметр', 'Значение'];

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export default function ArticleDecodeTable({ radiator: r }) {
  const [copied, setCopied] = useState(false);
  const mount = getMountingInfo(r.connection_type, r.height, r.length, r.radiator_type);

  // [label, plain text value, optional custom node]
  const rows = [
    ['Артикул', r.article],
    ['Описание', r.description_ru],
    ['Вид', SERIES.find(s => s.id === r.series)?.label],
    ['Тип', r.radiator_type],
    ['Высота', has(r.height) && `${r.height} мм`],
    ['Длина', has(r.length) && `${r.length} мм`],
    ['Глубина', has(r.depth) && `${r.depth} мм`],
    ['Межосевое расстояние', has(r.center_distance) && `${r.center_distance} мм`],
    ['Мин. расстояние от уровня пола до низа радиатора', has(r.min_floor_clearance) && `${r.min_floor_clearance} мм`],
    ['Мин. расстояние от стены', has(r.min_wall_clearance) && `${r.min_wall_clearance} мм`],
    ['Мин. расстояние от радиатора до низа окна или верхней части ниши', has(r.min_window_clearance) && `${r.min_window_clearance} мм`],
    ['Монтажная глубина FTU с настенным кронштейном', has(r.ftu_mounting_depth) && `${r.ftu_mounting_depth} мм`],
    ['Подключение', CONNECTION_LABELS[r.connection_type] || r.connection_type],
    ['Резьба подключения', r.connection_thread],
    ['Присоединение термоголовки', r.thermostat_connection],
    ['Крепление', mount && `${mount.article} ${mount.name}`, mount && (
      <span>
        <span className="font-mono font-semibold">{mount.article}</span>{' '}
        <span className="font-normal text-muted-foreground">{mount.name}</span>
      </span>
    )],
    ['Номинальный тепловой поток (ΔT=70 °C, ГОСТ Р 53583-2009)', has(r.heat_output_dt70) && `${Math.round(r.heat_output_dt70)} Вт`],
    ['Вес нетто', has(r.weight_net) && `${r.weight_net} кг`],
    ['Вес брутто', has(r.weight_gross) && `${r.weight_gross} кг`],
    ['Объём теплоносителя', has(r.volume) && `${r.volume} л`],
    ['Макс. рабочая температура', has(r.max_operating_temp) && `${r.max_operating_temp} °C`],
    ['Макс. рабочее давление', has(r.max_operating_pressure) && `${r.max_operating_pressure} бар`],
    ['Гарантия', has(r.warranty_years) && `${r.warranty_years} лет`],
    ['Срок службы', has(r.service_life_years) && `${r.service_life_years} лет`],
    ['Цвет', r.color],
    ['Страна производитель', r.country_of_origin],
    ['Описание продукта', has(r.promo_text) && r.promo_text, has(r.promo_text) && (
      <span className="text-xs font-normal text-muted-foreground leading-relaxed">{r.promo_text}</span>
    )],
  ].filter(([, v]) => has(v) && v !== false);

  const copyTable = async () => {
    const plain = [HEADERS.join('\t'), ...rows.map(([k, v]) => `${k}\t${v}`)].join('\n');
    const html = `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">`
      + `<thead><tr>${HEADERS.map(h => `<th align="left" style="background:#f1f1f1">${escapeHtml(h)}</th>`).join('')}</tr></thead>`
      + `<tbody>${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody>`
      + `</table>`;

    try {
      if (navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })]);
      } else {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        holder.style.position = 'fixed';
        holder.style.left = '-9999px';
        document.body.appendChild(holder);
        const range = document.createRange();
        range.selectNodeContents(holder);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        document.body.removeChild(holder);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = plain;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Параметр</th>
            <th className="px-3 py-2 font-semibold text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Значение</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={copyTable}
                        className="relative flex-shrink-0"
                        aria-label="Скопировать таблицу характеристик"
                      >
                        {copied ? (
                          <Check size={15} className="text-brand-green" />
                        ) : (
                          <Copy size={15} className="text-primary hover:text-primary-dark transition-colors" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0 text-xs">
                      {copied ? 'Скопировано' : 'Скопировать таблицу характеристик'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, value, node]) => (
            <tr key={k} className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground align-top">{k}</td>
              <td className="px-3 py-2 font-medium text-foreground">{node || value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}