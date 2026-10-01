import React from 'react';
import { SERIES, CONNECTION_LABELS, getMountingInfo } from '@/lib/radiatorData';

const has = (v) => v !== null && v !== undefined && v !== '';

export default function ArticleDecodeTable({ radiator: r }) {
  const mount = getMountingInfo(r.connection_type, r.height, r.length, r.radiator_type);
  const rows = [
    ['Артикул', r.article],
    ['Описание', r.description_ru],
    ['Вид', SERIES.find(s => s.id === r.series)?.label],
    ['Тип', r.radiator_type],
    ['Подключение', CONNECTION_LABELS[r.connection_type] || r.connection_type],
    ['Высота', has(r.height) && `${r.height} мм`],
    ['Длина', has(r.length) && `${r.length} мм`],
    ['Глубина', has(r.depth) && `${r.depth} мм`],
    ['Межосевое расстояние', has(r.center_distance) && `${r.center_distance} мм`],
    ['Крепление', mount && (
      <span><span className="font-mono font-semibold">{mount.article}</span> <span className="font-normal text-muted-foreground">{mount.name}</span></span>
    )],
    ['Номинальный тепловой поток (ΔT=70 °C, ГОСТ Р 53583-2009)', has(r.heat_output_dt70) && `${Math.round(r.heat_output_dt70)} Вт`],
    ['Вес нетто', has(r.weight_net) && `${r.weight_net} кг`],
    ['Вес брутто', has(r.weight_gross) && `${r.weight_gross} кг`],
    ['Объём теплоносителя', has(r.volume) && `${r.volume} л`],
  ].filter(([, v]) => has(v) && v !== false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Параметр</th>
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Значение</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-border">
              <td className="px-3 py-2 text-muted-foreground align-top">{k}</td>
              <td className="px-3 py-2 font-medium text-foreground">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}