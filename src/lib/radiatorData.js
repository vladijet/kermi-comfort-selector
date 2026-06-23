import { base44 } from '@/api/base44Client';

// Calculate logarithmic temperature difference (LMTD)
export function calcDtln(T1, T2, Tv) {
  T1 = parseFloat(T1);
  T2 = parseFloat(T2);
  Tv = parseFloat(Tv);
  if (isNaN(T1) || isNaN(T2) || isNaN(Tv)) return null;
  if (T1 <= Tv || T2 <= Tv) return null;
  const diff = T1 - T2;
  if (diff === 0) return T1 - Tv; // arithmetic mean when T1==T2
  const lnRatio = Math.log((T1 - Tv) / (T2 - Tv));
  if (lnRatio === 0) return null;
  return diff / lnRatio;
}

// Calculate heat output at custom temperature mode
export function calcHeatOutput(Q70, dtln_calc, dtln_passport, n) {
  if (!dtln_calc || !dtln_passport || !n) return null;
  return Q70 * Math.pow(dtln_calc / dtln_passport, n);
}

// Default passport mode: 105/75/20
export const PASSPORT_T1 = 105;
export const PASSPORT_T2 = 75;
export const PASSPORT_TV = 20;
export const PASSPORT_DTLN = calcDtln(PASSPORT_T1, PASSPORT_T2, PASSPORT_TV);

// Series definitions
export const SERIES = [
  { id: 'profil', label: 'Стандартные профильные' },
  { id: 'plan', label: 'Гладкие (План)' }
];

export const TYPES_BY_SERIES = {
  profil: [10, 11, 12, 20, 22, 30, 33],
  plan: [10, 20, 30]
};

export const CONNECTION_BY_SERIES = {
  profil: ['FK0', 'FTU'],
  plan: ['PK0', 'PTV']
};

export const CONNECTION_LABELS = {
  FK0: 'Профиль-К: FK0 — боковое подключение',
  FTU: 'Профиль-В: FTU — универсальное подключение',
  FTV: 'Профиль-В: FTV — универсальное подключение',
  PK0: 'План-К: PK0 — боковое подключение',
  PTV: 'План-В: PTV — универсальное подключение'
};

export async function loadRadiators(series, type) {
  const connectionTypes = CONNECTION_BY_SERIES[series] || [];
  const results = await base44.entities.Radiator.filter({
    series: series,
    radiator_type: type
  }, 'height,length', 500);
  return results;
}

export function groupRadiatorsBySize(radiators) {
  // Returns { heights: [], lengths: [], grid: { height: { length: [radiator, ...] } } }
  const heightSet = new Set();
  const lengthSet = new Set();
  const grid = {};

  for (const r of radiators) {
    heightSet.add(r.height);
    lengthSet.add(r.length);
    if (!grid[r.height]) grid[r.height] = {};
    if (!grid[r.height][r.length]) grid[r.height][r.length] = [];
    grid[r.height][r.length].push(r);
  }

  return {
    heights: Array.from(heightSet).sort((a, b) => a - b),
    lengths: Array.from(lengthSet).sort((a, b) => a - b),
    grid
  };
}