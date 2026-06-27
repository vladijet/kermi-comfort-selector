import React, { useMemo } from 'react';
import { calcHeatOutput, calcDtln } from '@/lib/radiatorData';

export default function HeatTable({
  radiators,
  calcMode,
  passportDtln,
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
          {/* Row 1: "Длина" label + length values, with border-bottom = line above "Высота" */}
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-background min-w-[88px] w-[88px] px-2 pt-1 pb-1 text-left align-middle">
              <span className="text-xs font-semibold text-muted-foreground">Длина</span>
            </th>
            {lengths.map(len => {
              const isLenSelected = selectedCell && selectedCell.length === len;
              return (
                <th key={len} className="text-center min-w-[72px] px-1 pt-1 pb-1 align-middle">
                  <span className={`inline-flex items-center justify-center w-12 h-8 rounded-full text-xs font-semibold transition-colors ${
                    isLenSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {len}
                  </span>
                </th>
              );
            })}
          </tr>
          {/* Row 2: "Высота" label — below the divider line */}
          <tr>
            <th className="sticky left-0 z-10 bg-background min-w-[88px] w-[88px] px-2 pt-2 pb-1 text-left align-middle">
              <span className="text-xs font-semibold text-muted-foreground">Высота</span>
            </th>
            {lengths.map(len => (
              <th key={len} className="min-w-[72px] px-1 pt-2 pb-1" />
            ))}
          </tr>
        </thead>
        <tbody>
          {heights.map((height, hIdx) => (
            <tr key={height} className={hIdx % 2 === 0 ? 'bg-background' : 'bg-secondary'}>
              <td className="sticky left-0 z-10 bg-inherit px-2 py-1 min-w-[88px] w-[88px]">
                <span className={`inline-flex items-center justify-center w-12 h-8 rounded-full text-sm font-semibold transition-colors ${
                  selectedCell && selectedCell.height === height
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground text-background'
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
                      <div className="text-muted-foreground/40 text-xs">—</div>
                    </td>
                  );
                }

                // Use first cell's heat output as representative (all same size should be same)
                const q70 = cells[0].heat_output_dt70;
                const n = cells[0].n_exponent;
                const qCalc = dtln_calc && passportDtln
                  ? calcHeatOutput(q70, dtln_calc, passportDtln, n)
                  : null;

                return (
                  <td
                    key={len}
                    onClick={() => onCellSelect({ height, length: len })}
                    className={`text-center px-1 py-1.5 cursor-pointer rounded transition-all duration-100 ${
                      isSelected
                        ? 'bg-kermi-sel ring-2 ring-primary ring-inset'
                        : 'hover:ring-1 hover:ring-primary hover:ring-inset'
                    }`}
                  >
                    <div className="text-xs text-muted-foreground leading-tight">{Math.round(q70)}</div>
                    {qCalc && (
                      <div className="text-sm font-bold text-kermi-heat leading-tight">{Math.round(qCalc)}</div>
                    )}
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