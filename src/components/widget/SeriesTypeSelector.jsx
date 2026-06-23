import React from 'react';
import { SERIES, TYPES_BY_SERIES } from '@/lib/radiatorData';

export default function SeriesTypeSelector({ series, type, onSeriesChange, onTypeChange }) {
  const types = TYPES_BY_SERIES[series] || [];

  return (
    <div className="space-y-4">
      {/* Series selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-500 w-10">Вид</span>
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
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-500 w-10">Тип</span>
        <div className="flex flex-wrap gap-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-150 ${
                type === t
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
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