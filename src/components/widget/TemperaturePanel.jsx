import React from 'react';
import { calcDtln, PASSPORT_T1, PASSPORT_T2, PASSPORT_TV } from '@/lib/radiatorData';

export default function TemperaturePanel({ calcMode, onChange }) {
  const { t1, t2, tv } = calcMode;
  const dtln = calcDtln(t1, t2, tv);
  const passportDtln = calcDtln(PASSPORT_T1, PASSPORT_T2, PASSPORT_TV);

  const input = (label, key) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <input
        type="number"
        value={calcMode[key]}
        onChange={e => onChange({ ...calcMode, [key]: e.target.value })}
        className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex flex-wrap items-end gap-6">
        {/* Passport mode */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Паспортный температурный режим</p>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Т1, °C</span>
              <div className="w-20 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">{PASSPORT_T1}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Т2, °C</span>
              <div className="w-20 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">{PASSPORT_T2}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Тв, °C</span>
              <div className="w-20 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">{PASSPORT_TV}</div>
            </div>
            <div className="flex flex-col gap-1 pb-0.5">
              <span className="text-xs text-gray-400">Dt (ΔТ)</span>
              <span className="text-sm font-medium text-gray-500 px-1">= {passportDtln ? passportDtln.toFixed(1) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-14 bg-gray-100 self-center" />

        {/* Calculated mode */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Расчётный температурный режим</p>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Т1, °C</span>
              <input
                type="number"
                value={t1}
                onChange={e => onChange({ ...calcMode, t1: e.target.value })}
                className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Т2, °C</span>
              <input
                type="number"
                value={t2}
                onChange={e => onChange({ ...calcMode, t2: e.target.value })}
                className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Тв, °C</span>
              <input
                type="number"
                value={tv}
                onChange={e => onChange({ ...calcMode, tv: e.target.value })}
                className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1 pb-0.5">
              <span className="text-xs text-gray-400">Dt (ΔТ)</span>
              {dtln ? (
                <span className="text-sm font-bold text-teal-600 px-1">= {dtln.toFixed(1)}</span>
              ) : (
                <span className="text-sm font-medium text-red-400 px-1">Ошибка</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}