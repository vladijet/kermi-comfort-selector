import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { calcHeatOutput, calcDtln, calcDtArith, CONNECTION_LABELS, RADIATOR_IMAGES } from '@/lib/radiatorData';
import BracketInfo from '@/components/widget/BracketInfo';

export default function ArticleList({ radiators, calcMode, passportMode, passportDtln, onArticleCopied }) {
  const [copiedId, setCopiedId] = useState(null);

  const dtln_calc = calcDtln(calcMode.t1, calcMode.t2, calcMode.tv);
  const dtArithPassport = calcDtArith(passportMode.t1, passportMode.t2, passportMode.tv);
  const dtArithCalc = calcDtArith(calcMode.t1, calcMode.t2, calcMode.tv);

  const copyArticle = (article) => {
    const el = document.createElement('textarea');
    el.value = article;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      setCopiedId(article);
      onArticleCopied?.();
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
    document.body.removeChild(el);
  };

  const grouped = {};
  for (const r of radiators) {
    if (!grouped[r.connection_type]) grouped[r.connection_type] = [];
    grouped[r.connection_type].push(r);
  }

  if (!radiators.length) return null;

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([connType, items]) => {
        const rType = items[0]?.radiator_type;
        const imageKey = `${items[0]?.series}_${connType}_${rType}`;
        const imgUrl = RADIATOR_IMAGES[imageKey];

        return (
          <div key={connType} className="rounded-xl border border-border overflow-hidden">
            {/* Header row: label + image */}
            <div className="flex items-center justify-between px-4 py-2 bg-secondary">
              <span className="text-xs font-medium text-muted-foreground">
                {CONNECTION_LABELS[connType] || connType}
              </span>
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={`Чертёж ${connType} тип ${rType}`}
                  className="h-10 md:h-16 w-auto object-contain"
                />
              )}
            </div>

            {/* Article rows */}
            <div className="divide-y divide-border">
              {items.map(r => {
                const qCalc = dtln_calc && passportDtln
                  ? calcHeatOutput(r.heat_output_dt70, dtln_calc, passportDtln, r.n_exponent)
                  : null;
                const isCopied = copiedId === r.article;

                return (
                  <div key={r.article} className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
                    {/* Article + copy */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-sm md:text-base font-semibold text-foreground whitespace-nowrap">
                        {r.article}
                      </span>
                      <button
                        onClick={() => copyArticle(r.article)}
                        className="relative flex-shrink-0"
                        title="Скопировать артикул"
                      >
                        {isCopied ? (
                          <Check size={14} className="text-brand-green" />
                        ) : (
                          <Copy size={14} className="text-muted-foreground hover:text-brand-green transition-colors" />
                        )}
                        {isCopied && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                            Скопировано
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    {(r.description_ru || r.description_en) && (
                      <span className="text-xs md:text-sm text-muted-foreground flex-1 min-w-0 truncate">
                        {r.description_ru || r.description_en}
                      </span>
                    )}

                    {/* Heat outputs */}
                    <div className="flex items-center gap-6 ml-auto flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm md:text-base font-normal text-muted-foreground">{Math.round(r.heat_output_dt70)} Вт</div>
                        <div className="text-[10px] md:text-xs text-kermi-pass">ΔТ пасп {dtArithPassport ? dtArithPassport.toFixed(0) : '—'}°</div>
                      </div>
                      {qCalc && (
                        <div className="text-right">
                          <div className="text-sm md:text-base font-bold text-kermi-heat">{Math.round(qCalc)} Вт</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">ΔТ расч {dtArithCalc ? dtArithCalc.toFixed(0) : '—'}°</div>
                        </div>
                      )}
                      {r.weight_net && (
                        <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{r.weight_net} кг</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <BracketInfo
              connectionType={connType}
              height={items[0].height}
              length={items[0].length}
              radiatorType={items[0].radiator_type}
            />
          </div>
        );
      })}
    </div>
  );
}