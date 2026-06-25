import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { calcHeatOutput, calcDtln, calcDtArith, CONNECTION_LABELS, RADIATOR_IMAGES } from '@/lib/radiatorData';
import BracketInfo from '@/components/widget/BracketInfo';

export default function ArticleList({ radiators, calcMode, passportMode, passportDtln }) {
  const [copiedId, setCopiedId] = useState(null);

  const dtln_calc = calcDtln(calcMode.t1, calcMode.t2, calcMode.tv);
  const dtArithPassport = calcDtArith(passportMode.t1, passportMode.t2, passportMode.tv);
  const dtArithCalc = calcDtArith(calcMode.t1, calcMode.t2, calcMode.tv);

  const copyArticle = (article) => {
    navigator.clipboard.writeText(article).then(() => {
      setCopiedId(article);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = article;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(article);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Group by connection type
  const grouped = {};
  for (const r of radiators) {
    if (!grouped[r.connection_type]) grouped[r.connection_type] = [];
    grouped[r.connection_type].push(r);
  }

  if (!radiators.length) return null;

  return (
    <div className="mt-6 space-y-4">
      {Object.entries(grouped).map(([connType, items]) => (
        <div key={connType} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          {(() => {
            const rType = items[0]?.radiator_type;
            const imageKey = `${items[0]?.series}_${connType}_${rType}`;
            const imgUrl = RADIATOR_IMAGES[imageKey];
            return (
              <div className="flex items-center justify-between gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  {CONNECTION_LABELS[connType] || connType}
                </span>
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={`Чертёж ${connType} тип ${rType}`}
                    className="h-16 w-auto object-contain"
                  />
                )}
              </div>
            );
          })()}
          <div className="divide-y divide-gray-50">
            {items.map(r => {
              const qCalc = dtln_calc && passportDtln
                ? calcHeatOutput(r.heat_output_dt70, dtln_calc, passportDtln, r.n_exponent)
                : null;
              const isCopied = copiedId === r.article;

              return (
                <div key={r.article} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Article + copy */}
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <span className="font-mono text-sm font-semibold text-gray-800">{r.article}</span>
                    <button
                      onClick={() => copyArticle(r.article)}
                      className="relative group"
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
                  <div className="flex-1 text-sm text-gray-600 truncate">
                    {r.description_ru}
                  </div>

                  {/* Heat output with temperature head labels */}
                  <div className="flex flex-col gap-0.5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{Math.round(r.heat_output_dt70)} Вт</span>
                      {qCalc && (
                        <>
                          <span className="text-gray-300">/</span>
                          <span className="font-bold text-kermi-heat">{Math.round(qCalc)} Вт</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium">
                      <span className="text-gray-400">ΔТ пасп {dtArithPassport ? dtArithPassport.toFixed(0) : '—'}°</span>
                      {qCalc && (
                        <>
                          <span className="text-transparent">/</span>
                          <span className="text-kermi-heat">ΔТ расч {dtArithCalc ? dtArithCalc.toFixed(0) : '—'}°</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  {r.weight_net && (
                    <div className="text-sm text-gray-400 whitespace-nowrap">
                      {r.weight_net} кг
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <BracketInfo
            connectionType={connType}
            height={items[0].height}
            length={items[0].length}
          />
        </div>
      ))}
    </div>
  );
}