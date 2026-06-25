import React, { useMemo } from 'react';
import { calcHeatOutput, calcDtln, PASSPORT_DTLN } from '@/lib/radiatorData';

export default function HeatTable({
  radiators,
  calcMode,
  selectedCell,
  onCellSelect
}) {
  const dtln_calc = calcDtln(calcMode.t1, calcMode.t2, calcMode.tv);

  const { heights, lengths, grid } = useMemo(() => {
    const heightSet = new Set();
    const lengthSet = new Set();
    const g = {};
    for (const r of radiators) {
      heightSet.add(r.height);
      lengthSet.add(r.length);
      if (!g[r.height]) g[r.height] = {};
      if (!g[r.height][r.length]) g[r.height][r.length] = [];
      g[r.height][r.length].push(r);
    }
    return {
      heights: Array.from(heightSet).sort((a, b) => a - b),
      lengths: Array.from(lengthSet).sort((a, b) => a - b),
      grid: g
    };
  }, [radiators]);

  if (!radiators.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Нет данных для выбранного типа
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse" style={{ minWidth: '100%' }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white min-w-[70px] w-[70px]">
              <div className="text-[11px] text-gray-400 font-semibold text-left px-2 pb-1">Высота</div>
            </th>
            <th
              colSpan={lengths.length}
              className="text-[11px] text-gray-400 font-semibold text-center pb-1"
            >
              Длина
            </th>
          </tr>
          <tr>
            <th className="sticky left-0 z-10 bg-white min-w-[70px] w-[70px]" />
            {lengths.map(len => (
              <th
                key={len}
                className={`text-center min-w-[72px] px-1 pb-2 text-xs font-semibold transition-colors ${
                  selectedCell && selectedCell.length === len
                    ? 'text-teal-600'
                    : 'text-gray-500'
                }`}
              >
                {len}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heights.map((height, hIdx) => (
            <tr key={height} className={hIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="sticky left-0 z-10 bg-inherit px-2 py-2">
                <span className={`inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-semibold transition-colors ${
                  selectedCell && selectedCell.height === height
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-white'
                }`}>
                  {height}
                </span>
              </td>
              {lengths.map(len => {
                const cells = grid[height]?.[len];
                const isSelected = selectedCell && selectedCell.height === height && selectedCell.length === len;

                if (!cells || !cells.length) {
                  return (
                    <td key={len} className="text-center px-1 py-2">
                      <div className="text-gray-300 text-xs">—</div>
                    </td>
                  );
                }

                // Use first cell's heat output as representative (all same size should be same)
                const q70 = cells[0].heat_output_dt70;
                const n = cells[0].n_exponent;
                const qCalc = dtln_calc && PASSPORT_DTLN
                  ? calcHeatOutput(q70, dtln_calc, PASSPORT_DTLN, n)
                  : null;

                return (
                  <td
                    key={len}
                    onClick={() => onCellSelect({ height, length: len })}
                    className={`text-center px-1 py-1.5 cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'bg-teal-50 rounded'
                        : 'hover:bg-gray-100'
                    } ${
                      selectedCell && (selectedCell.length === len || selectedCell.height === height)
                        ? 'opacity-100'
                        : ''
                    }`}
                  >
                    <div className="relative">
                      {isSelected && (
                        <div className="absolute inset-0 rounded border-2 border-teal-400 pointer-events-none" />
                      )}
                      <div className="text-xs text-gray-500 leading-tight">{Math.round(q70)}</div>
                      {qCalc && (
                        <div className="text-sm font-bold text-teal-600 leading-tight">{Math.round(qCalc)}</div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}