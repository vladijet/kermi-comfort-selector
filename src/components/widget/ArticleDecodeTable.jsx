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
    ['Крепление', mount && (
      <span><span className="font-mono font-semibold">{mount.article}</span> <span className="font-normal text-muted-foreground">{mount.name}</span></span>
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
    ['Описание продукта', has(r.promo_text) && <span className="text-xs font-normal text-muted-foreground leading-relaxed">{r.promo_text}</span>],
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