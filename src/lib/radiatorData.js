import { base44 } from '@/api/base44Client';

// Calculate logarithmic temperature difference (LMTD)
// Used for heat output calculations (physically accurate)
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

// Calculate arithmetic mean temperature difference
// Used for display only — gives a clean, intuitive number for the user
export function calcDtArith(T1, T2, Tv) {
  T1 = parseFloat(T1);
  T2 = parseFloat(T2);
  Tv = parseFloat(Tv);
  if (isNaN(T1) || isNaN(T2) || isNaN(Tv)) return null;
  return (T1 + T2) / 2 - Tv;
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
  { id: 'profil', label: 'Стандартные (Профиль)' },
  { id: 'plan', label: 'Гладкие (План)' }
];

export const TYPES_BY_SERIES = {
  profil: [10, 11, 12, 20, 22, 30, 33],
  plan: [10, 20, 30]
};

export const CONNECTION_BY_SERIES = {
  profil: ['FK0', 'FTU', 'FTV'],
  plan: ['PK0', 'PTV']
};

export const CONNECTION_LABELS = {
  FK0: 'Профиль-К: FK0 — боковое подключение',
  FTU: 'Профиль-В: FTU — универсальное подключение с вентилем',
  FTV: 'Профиль-В: FTV — нижнее подключение с вентилем',
  PK0: 'План-К: PK0 — боковое подключение',
  PTV: 'План-В: PTV — нижнее подключение с вентилем'
};

// Drawings (чертежи) keyed by `${series}_${connection_type}_${radiator_type}`
const IMG_BASE = 'https://media.base44.com/images/public/6a3a434b2f3f3e79050bd884/';
export const RADIATOR_IMAGES = {
  profil_FK0_33: IMG_BASE + 'e3450b4cf_KermiCRU-T33FK033.png',
  profil_FK0_30: IMG_BASE + '69efeb241_KermiCRU-T30FK030.png',
  profil_FK0_22: IMG_BASE + '76a907cde_KermiCRU-T22FK022.png',
  profil_FK0_20: IMG_BASE + '0a3915c8c_KermiCRU-T20FK020.png',
  profil_FK0_12: IMG_BASE + 'ce85ce9b8_KermiCRU-T12FK012.png',
  profil_FK0_11: IMG_BASE + '06ade1a61_KermiCRU-T11FK011.png',
  profil_FK0_10: IMG_BASE + '250f80d05_KermiCRU-T10FK010.png',
  profil_FTV_33: IMG_BASE + '9fb8846f1_KermiCRU-T33FTV33.png',
  profil_FTV_30: IMG_BASE + '2ff798bd5_KermiCRU-T30FTV30.png',
  profil_FTV_22: IMG_BASE + 'd59ceb72f_KermiCRU-T22FTV22.png',
  profil_FTV_20: IMG_BASE + '7498154b9_KermiCRU-T20FTV20.png',
  profil_FTV_12: IMG_BASE + '116c151cb_KermiCRU-T12FTV12.png',
  profil_FTV_11: IMG_BASE + '6b5c1e826_KermiCRU-T11FTV11.png',
  profil_FTV_10: IMG_BASE + '1767c6205_KermiCRU-T10FTV10.png',
  profil_FTU_33: IMG_BASE + '859c60fb1_KermiCRU-JCT33FTU33.png',
  profil_FTU_22: IMG_BASE + 'c0836db33_KermiCRU-JCT22FTU22.png',
  profil_FTU_12: IMG_BASE + '2d9e1a0bd_KermiCRU-JCT12FTU12.png',
  plan_PK0_30: IMG_BASE + 'd155d38aa_KermiCRU-T30PK030.png',
  plan_PK0_20: IMG_BASE + '7837095f6_KermiCRU-T20PK020.png',
  plan_PK0_10: IMG_BASE + 'c9d25c3b3_KermiCRU-T10PK010.png',
  plan_PTV_30: IMG_BASE + 'e5dd977e8_KermiCRU-T30PTV30.png',
  plan_PTV_20: IMG_BASE + '818c24a21_KermiCRU-T20PTV20.png',
  plan_PTV_10: IMG_BASE + 'b7bc37df3_KermiCRU-T10PTV10.png'
};

export async function loadRadiators(series, type) {
  const connectionTypes = CONNECTION_BY_SERIES[series] || [];
  const results = await base44.entities.Radiator.filter({
    series: series,
    radiator_type: type
  }, 'height,length', 500);
  return results;
}

// Mounting brackets (Крепления)
// Wall brackets that ship in the radiator kit. FTU has none in kit — ordered separately.
export const WALL_BRACKET_KIT_TYPES = ['FK0', 'PK0', 'FTV', 'PTV'];
export const LONG_LENGTH_THRESHOLD = 1700;

// Standart: Профиль-В и Профиль-К (FK0, FTV)
const WALL_BRACKETS_STANDARD = {
  300: 'ZB00122626',
  400: 'ZB00147749',
  500: 'ZB00119538',
  600: 'ZB00154388'
};

// FTU: универсальные радиаторы Профиль-В JC
const WALL_BRACKETS_FTU = {
  200: 'ZB02970200',
  300: 'ZB02970300',
  400: 'ZB02970400',
  500: 'ZB02970500',
  600: 'ZB02970600'
};

// Гигиеническое исполнение: План (PK0, PTV) типы 10/20/30
const WALL_BRACKETS_GIGIENIC = {
  300: 'ZB00205949',
  400: 'ZB00206553',
  500: 'ZB00206555',
  600: 'ZB00206557'
};

export const BRACKET_NAMES = {
  ZB00122626: 'Настенный кронштейн для радиаторов Профиль-В и Профиль-К, монтажная высота 300 мм',
  ZB00147749: 'Настенный кронштейн для радиаторов Профиль-В и Профиль-К, монтажная высота 400 мм',
  ZB00119538: 'Настенный кронштейн для радиаторов Профиль-В и Профиль-К, монтажная высота 500 мм',
  ZB00154388: 'Настенный кронштейн для радиаторов Профиль-В и Профиль-К, монтажная высота 600 мм',
  ZB02970200: 'Настенный кронштейн для универсальных радиаторов Профиль-В JC и Профиль-К JC, монтажная высота 200 мм',
  ZB02970300: 'Настенный кронштейн для универсальных радиаторов Профиль-В JC, монтажная высота 300 мм',
  ZB02970400: 'Настенный кронштейн для универсальных радиаторов Профиль-В JC, монтажная высота 400 мм',
  ZB02970500: 'Настенный кронштейн для универсальных радиаторов Профиль-В JC, монтажная высота 500 мм',
  ZB02970600: 'Настенный кронштейн для универсальных радиаторов Профиль-В JC, монтажная высота 600 мм',
  ZB00205949: 'Настенный кронштейн для радиаторов в гигиеническом исполнении типы 10/20/30 монтажная высота 300 мм (оцинкованный)',
  ZB00206553: 'Настенный кронштейн для радиаторов в гигиеническом исполнении типы 10/20/30 монтажная высота 400 мм (оцинкованный)',
  ZB00206555: 'Настенный кронштейн для радиаторов в гигиеническом исполнении типы 10/20/30 монтажная высота 500 мм (оцинкованный)',
  ZB00206557: 'Настенный кронштейн для радиаторов в гигиеническом исполнении типы 10/20/30 монтажная высота 600 мм (оцинкованный)',
  ZB00186323: 'Внутренний напольный кронштейн для радиаторов типов 12, 22, 33',
  ZB00149310: 'Наружный напольный кронштейн для радиаторов типов 10, 11, 20, 30'
};

const HYGIENIC_CONNECTIONS = ['FK0', 'FTV', 'PK0', 'PTV'];
const HYGIENIC_TYPES = [10, 20, 30];

function getWallBracketSet(connectionType, radiatorType) {
  if (connectionType === 'FTU') return WALL_BRACKETS_FTU;
  if (HYGIENIC_CONNECTIONS.includes(connectionType) && HYGIENIC_TYPES.includes(Number(radiatorType))) return WALL_BRACKETS_GIGIENIC;
  return WALL_BRACKETS_STANDARD;
}

// Returns wall bracket info for a given radiator (connection type, height, length, radiatorType)
// inKit = true  -> bracket included in the kit (count 2, or 3 when length >= 1700 mm)
// inKit = false -> bracket ordered separately (FTU)
export function getMountingInfo(connectionType, height, length, radiatorType) {
  height = Number(height);
  length = Number(length);
  const wallSet = getWallBracketSet(connectionType, radiatorType);
  const article = wallSet[height];
  if (!article) return null;
  const inKit = WALL_BRACKET_KIT_TYPES.includes(connectionType);
  const count = length >= LONG_LENGTH_THRESHOLD ? 3 : 2;
  return { article, name: BRACKET_NAMES[article], inKit, count };
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