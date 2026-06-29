import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
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
    } catch (err) {}
    document.body.removeChild(el);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border-t border-border flex-wrap">
      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Крепления
      </span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
          info.inKit
            ? 'bg-brand-green/10 text-brand-green'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {info.inKit ? 'В комплекте' : 'Заказывается отдельно'}
      </span>

      {/* Article + copy */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm md:text-base font-semibold text-foreground">{info.article}</span>
        <button onClick={copyArticle} className="relative" title="Скопировать артикул">
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
      </div>

      {/* Name */}
      <span className="text-xs md:text-sm text-muted-foreground flex-1 min-w-0">{info.name}</span>

      {/* Count */}
      <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap ml-auto">
        {info.count} шт.
        {isLong && (
          <span className="text-[10px] font-normal text-muted-foreground ml-1">(для длины от {LONG_LENGTH_THRESHOLD} мм)</span>
        )}
      </span>
    </div>
  );
}