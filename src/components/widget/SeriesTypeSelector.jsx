import React from 'react';
import { SERIES, TYPES_BY_SERIES } from '@/lib/radiatorData';

export default function SeriesTypeSelector({ series, type, onSeriesChange, onTypeChange }) {
  const types = TYPES_BY_SERIES[series] || [];

  return (
    <div className="space-y-4">
      {/* Series selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-muted-foreground w-10">Вид</span>
        <div className="flex flex-wrap gap-2">
          {SERIES.map(s => (
            <button
              key={s.id}
              onClick={() => {
                onSeriesChange(s.id);
                onTypeChange(TYPES_BY_SERIES[s.id][0]);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                series === s.id
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-muted-foreground w-10">Тип</span>
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-150 ${
                type === t
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark'
                  : 'bg-foreground text-background hover:bg-foreground/80'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}