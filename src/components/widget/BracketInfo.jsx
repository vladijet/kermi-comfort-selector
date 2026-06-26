import React from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { getMountingInfo, LONG_LENGTH_THRESHOLD } from '@/lib/radiatorData';

export default function BracketInfo({ connectionType, height, length, radiatorType }) {
  const info = getMountingInfo(connectionType, height, length, radiatorType);
  if (!info) return null;

  const isLong = Number(length) >= LONG_LENGTH_THRESHOLD;

  return (
    <div className="px-4 py-3 bg-amber-50/40 border-t border-gray-50">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Крепления
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            info.inKit
              ? 'bg-brand-green/10 text-brand-green'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {info.inKit ? <Package size={10} /> : <ShoppingCart size={10} />}
          {info.inKit ? 'В комплекте' : 'Заказывается отдельно'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold text-gray-800">{info.article}</span>
        <span className="flex-1 text-sm text-gray-600 truncate">{info.name}</span>
        <span className="text-sm font-semibold text-kermi-heat whitespace-nowrap">
          {info.count} шт.
          {isLong && (
            <span className="text-[10px] font-normal text-gray-400 ml-1">
              (для длины от {LONG_LENGTH_THRESHOLD} мм)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}