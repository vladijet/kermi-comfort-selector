import React, { useState } from 'react';
import { Package, ShoppingCart, Copy, Check } from 'lucide-react';
import { getMountingInfo, LONG_LENGTH_THRESHOLD } from '@/lib/radiatorData';

export default function BracketInfo({ connectionType, height, length, radiatorType }) {
  const info = getMountingInfo(connectionType, height, length, radiatorType);
  const [copied, setCopied] = useState(false);

  if (!info) return null;

  const isLong = Number(length) >= LONG_LENGTH_THRESHOLD;

  const copyArticle = () => {
    const el = document.createElement('textarea');
    el.value = info.article;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // silent
    }
    document.body.removeChild(el);
  };

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
        <button onClick={copyArticle} className="relative group" title="Скопировать артикул">
          {copied ? (
            <Check size={14} className="text-brand-green" />
          ) : (
            <Copy size={14} className="text-muted-foreground hover:text-brand-green transition-colors" />
          )}
          {copied && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
              Скопировано
            </span>
          )}
        </button>
        <span className="flex-1 text-sm text-gray-600">{info.name}</span>
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