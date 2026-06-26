import React from 'react';
import { calcDtArith } from '@/lib/radiatorData';

export default function TemperaturePanel({ calcMode, onChange, passportMode, onPassportChange }) {
  const dtArith = calcDtArith(calcMode.t1, calcMode.t2, calcMode.tv);
  const passportDtArith = calcDtArith(passportMode.t1, passportMode.t2, passportMode.tv);

  const renderTempInput = (label, mode, key, onModeChange) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number"
        value={mode[key]}
        onChange={e => onModeChange({ ...mode, [key]: e.target.value })}
        className="w-20 px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
      />
    </div>
  );

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex flex-wrap items-end gap-6">
        {/* Passport mode */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Паспортный температурный режим</p>
          <div className="flex items-end gap-3">
            {renderTempInput('Т1, °C', passportMode, 't1', onPassportChange)}
            {renderTempInput('Т2, °C', passportMode, 't2', onPassportChange)}
            {renderTempInput('Тв, °C', passportMode, 'tv', onPassportChange)}
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
          <div className="flex items-end gap-3 flex-wrap">
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
            <div className="flex items-center gap-2 ml-8">
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
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-kermi-sel ring-2 ring-primary ring-inset text-kermi-heat'
                        : 'bg-background text-muted-foreground hover:ring-1 hover:ring-primary hover:ring-inset'
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