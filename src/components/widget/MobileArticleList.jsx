import React, { useState } from 'react';
import { Copy, Check, Package, ShoppingCart } from 'lucide-react';
import { calcHeatOutput, calcDtln, calcDtArith, CONNECTION_LABELS, RADIATOR_IMAGES, getMountingInfo, LONG_LENGTH_THRESHOLD } from '@/lib/radiatorData';

function MobileBracketInfo({ connectionType, height, length, radiatorType }) {
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
    try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) {}
    document.body.removeChild(el);
  };

  return (
    <div className="px-4 py-3 bg-amber-50/40 border-t border-gray-100 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Крепления</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
          info.inKit ? 'bg-brand-green/10 text-brand-green' : 'bg-amber-100 text-amber-700'
        }`}>
          {info.inKit ? <Package size={10} /> : <ShoppingCart size={10} />}
          {info.inKit ? 'В комплекте' : 'Заказывается отдельно'}
        </span>
      </div>
      <div className="text-sm text-gray-600">{info.name}</div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-gray-800">{info.article}</span>
        <button onClick={copyArticle} className="relative" title="Скопировать артикул">
          {copied ? <Check size={14} className="text-brand-green" /> : <Copy size={14} className="text-muted-foreground hover:text-brand-green transition-colors" />}
          {copied && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">Скопировано</span>
          )}
        </button>
        <span className="text-sm font-semibold text-kermi-heat">{info.count} шт.</span>
        {isLong && <span className="text-[10px] text-gray-400">(от {LONG_LENGTH_THRESHOLD} мм)</span>}
      </div>
    </div>
  );
}

export default function MobileArticleList({ radiators, calcMode, passportMode, passportDtln, onArticleCopied }) {
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
    <div className="mt-4 space-y-4">
      {Object.entries(grouped).map(([connType, items]) => {
        const rType = items[0]?.radiator_type;
        const imageKey = `${items[0]?.series}_${connType}_${rType}`;
        const imgUrl = RADIATOR_IMAGES[imageKey];

        return (
          <div key={connType} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 pt-3 pb-1 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500">{CONNECTION_LABELS[connType] || connType}</span>
            </div>

            {/* Image */}
            {imgUrl && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-center">
                <img src={imgUrl} alt={`Чертёж ${connType} тип ${rType}`} className="h-20 w-auto object-contain" />
              </div>
            )}

            {/* Articles */}
            <div className="divide-y divide-gray-100">
              {items.map(r => {
                const qCalc = dtln_calc && passportDtln
                  ? calcHeatOutput(r.heat_output_dt70, dtln_calc, passportDtln, r.n_exponent)
                  : null;
                const isCopied = copiedId === r.article;

                return (
                  <div key={r.article} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-800">{r.article}</span>
                      <button onClick={() => copyArticle(r.article)} className="relative" title="Скопировать артикул">
                        {isCopied ? <Check size={14} className="text-brand-green" /> : <Copy size={14} className="text-muted-foreground hover:text-brand-green transition-colors" />}
                        {isCopied && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">Скопировано</span>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Номинал: <span className="font-medium">{Math.round(r.heat_output_dt70)} Вт</span>
                      <span className="text-xs ml-1 text-gray-300">(ΔТ {dtArithPassport ? dtArithPassport.toFixed(0) : '—'}°)</span>
                    </div>
                    {qCalc && (
                      <div className="text-sm text-kermi-heat">
                        Расчёт: <span className="font-bold">{Math.round(qCalc)} Вт</span>
                        <span className="text-xs ml-1 text-gray-400">(ΔТ {dtArithCalc ? dtArithCalc.toFixed(0) : '—'}°)</span>
                      </div>
                    )}
                    {r.weight_net && <div className="text-xs text-gray-400">Вес: {r.weight_net} кг</div>}
                  </div>
                );
              })}
            </div>

            <MobileBracketInfo
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