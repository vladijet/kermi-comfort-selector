import React from 'react';
import { calcDtArith } from '@/lib/radiatorData';

export default function TemperaturePanel({ calcMode, onChange, passportMode, onPassportChange }) {
  const dtArith = calcDtArith(calcMode.t1, calcMode.t2, calcMode.tv);
  const passportDtArith = calcDtArith(passportMode.t1, passportMode.t2, passportMode.tv);

  const renderTempInput = (label, mode, key, onModeChange, readOnly = false) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number"
        value={mode[key]}
        onChange={e => onModeChange({ ...mode, [key]: e.target.value })}
        readOnly={readOnly}
        className={`w-16 px-2 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:border-transparent transition ${
          readOnly
            ? 'text-gray-400 bg-secondary cursor-not-allowed'
            : 'text-foreground focus:ring-2 focus:ring-primary'
        }`}
      />
    </div>
  );

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex flex-nowrap items-end gap-4">
        {/* Passport mode */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">НОМИНАЛЬНЫЙ ТЕМПЕРАТУРНЫЙ РЕЖИМ</p>
          <div className="flex items-end gap-3">
            {renderTempInput('Т1, °C', passportMode, 't1', onPassportChange, true)}
            {renderTempInput('Т2, °C', passportMode, 't2', onPassportChange, true)}
            {renderTempInput('Тв, °C', passportMode, 'tv', onPassportChange, true)}
            <div className="flex flex-col gap-1 pb-0.5">
              <span className="text-xs text-kermi-pass">ΔТ, °C</span>
              <span className="text-sm font-bold text-kermi-pass px-1">
                = {passportDtArith ? passportDtArith.toFixed(0) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-14 bg-gray-100 self-center" />

        {/* Calculated mode */}
        <div>
          <p className="text-xs text-kermi-heat mb-3 font-semibold uppercase tracking-wide">Расчётный температурный режим</p>
          <div className="flex items-end gap-3">
            {renderTempInput('Т1, °C', calcMode, 't1', onChange)}
            {renderTempInput('Т2, °C', calcMode, 't2', onChange)}
            {renderTempInput('Тв, °C', calcMode, 'tv', onChange)}
            <div className="flex flex-col gap-1 pb-0.5">
              <span className="text-xs text-gray-400">ΔТ, °C</span>
              {dtArith ? (
                <span className="text-sm font-bold text-kermi-heat px-1">= {dtArith.toFixed(0)}</span>
              ) : (
                <span className="text-sm font-medium text-brand-red px-1">Ошибка</span>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 ml-2">
              {[
                { label: 'ΔТ 30', t1: 60, t2: 40, tv: 20 },
                { label: 'ΔТ 40', t1: 65, t2: 55, tv: 20 },
                { label: 'ΔТ 50', t1: 75, t2: 65, tv: 20 },
                { label: 'ΔТ 60', t1: 90, t2: 70, tv: 20 },
              ].map(preset => {
                const isActive = calcMode.t1 == preset.t1 && calcMode.t2 == preset.t2 && calcMode.tv == preset.tv;
                return (
                  <button
                    key={preset.label}
                    onClick={() => onChange({ t1: preset.t1, t2: preset.t2, tv: preset.tv })}
                    title={`${preset.t1}/${preset.t2}/${preset.tv}`}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-[#F4F4F4] text-[#191919] font-semibold'
                        : 'bg-transparent text-gray-400 font-normal hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}