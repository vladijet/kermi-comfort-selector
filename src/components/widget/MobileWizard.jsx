import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SERIES, TYPES_BY_SERIES, calcDtln, calcDtArith } from '@/lib/radiatorData';
import HeatTable from '@/components/widget/HeatTable';
import MobileArticleList from '@/components/widget/MobileArticleList';

const PRESETS = [
  { label: 'ΔТ 30', t1: 60, t2: 40, tv: 20 },
  { label: 'ΔТ 40', t1: 65, t2: 55, tv: 20 },
  { label: 'ΔТ 50', t1: 75, t2: 65, tv: 20 },
  { label: 'ΔТ 60', t1: 90, t2: 70, tv: 20 },
];

function AccordionSection({ id, activeStep, onOpen, title, summary, children }) {
  const isOpen = activeStep === id;
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => onOpen(id)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {!isOpen && summary && (
            <span className="text-xs text-muted-foreground">{summary}</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function MobileWizard({ loadRadiatorsFn, trackEventFn }) {
  const [activeStep, setActiveStep] = useState('config');

  // Config state
  const [series, setSeries] = useState('profil');
  const [type, setType] = useState(22);

  // Temperature state
  const [calcMode, setCalcMode] = useState({ t1: 75, t2: 65, tv: 20 });
  const [passportMode] = useState({ t1: 105, t2: 75, tv: 20 });
  const passportDtln = calcDtln(passportMode.t1, passportMode.t2, passportMode.tv);

  // Table state
  const [radiators, setRadiators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedRadiators, setSelectedRadiators] = useState([]);
  const [showArticles, setShowArticles] = useState(false);

  const articlesRef = useRef(null);

  // Load radiators when series or type changes
  useEffect(() => {
    setSelectedCell(null);
    setSelectedRadiators([]);
    setShowArticles(false);
    setLoading(true);
    loadRadiatorsFn(series, type)
      .then(data => { setRadiators(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [series, type, loadRadiatorsFn]);

  // Track widget open once
  useEffect(() => {
    trackEventFn?.('widget_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected radiators when cell changes
  useEffect(() => {
    if (!selectedCell) {
      setSelectedRadiators([]);
      return;
    }
    const matching = radiators.filter(
      r => r.height === selectedCell.height && r.length === selectedCell.length
    );
    setSelectedRadiators(matching);
    setShowArticles(false);
  }, [selectedCell, radiators]);

  const handleSeriesChange = (newSeries) => {
    setSeries(newSeries);
    setType(TYPES_BY_SERIES[newSeries][0]);
  };

  const handleCellSelect = (cell) => {
    setSelectedCell(cell);
    setShowArticles(true);
    setActiveStep(null);
    trackEventFn?.('calculation_performed');
    setTimeout(() => {
      articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleShowArticles = () => {
    setShowArticles(true);
    setTimeout(() => {
      articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleArticleCopied = () => {
    trackEventFn?.('article_copied');
  };

  // Summaries for accordion headers
  const seriesLabel = SERIES.find(s => s.id === series)?.label || series;
  const configSummary = `${seriesLabel} / Тип ${type}`;
  const tempSummary = `${calcMode.t1}/${calcMode.t2}/${calcMode.tv} °C`;

  const dtArith = calcDtArith(calcMode.t1, calcMode.t2, calcMode.tv);

  return (
    <div className="bg-background p-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full space-y-3">

        {/* Step 1: Config */}
        <AccordionSection
          id="config"
          activeStep={activeStep}
          onOpen={setActiveStep}
          title="Вид и Тип"
          summary={configSummary}
        >
          {/* Series chips */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Вид</p>
              <div className="flex flex-wrap gap-2">
                {SERIES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSeriesChange(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                      series === s.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Тип</p>
              <div className="flex flex-wrap gap-2">
                {(TYPES_BY_SERIES[series] || []).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`w-12 h-12 rounded-full text-sm font-semibold transition-all duration-150 ${
                      type === t
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-foreground text-background hover:bg-foreground/80'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveStep('temp')}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mt-2"
            >
              Далее
            </button>
          </div>
        </AccordionSection>

        {/* Step 2: Temperature */}
        <AccordionSection
          id="temp"
          activeStep={activeStep}
          onOpen={setActiveStep}
          title="Температурный режим"
          summary={tempSummary}
        >
          <div className="space-y-4">
            {/* Passport mode */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Номинальный режим</p>
              <div className="flex items-end gap-3">
                {['t1', 't2', 'tv'].map((key, i) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">{['Т1, °C', 'Т2, °C', 'Тв, °C'][i]}</span>
                    <input
                      type="number"
                      value={passportMode[key]}
                      readOnly
                      className="w-16 px-2 py-2 rounded-lg border border-border bg-secondary text-sm font-medium text-muted-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Calc mode */}
            <div>
              <p className="text-xs text-kermi-heat mb-2 font-medium uppercase tracking-wide">Расчётный режим</p>
              <div className="flex items-end gap-3">
                {['t1', 't2', 'tv'].map((key, i) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400">{['Т1, °C', 'Т2, °C', 'Тв, °C'][i]}</span>
                    <input
                      type="number"
                      value={calcMode[key]}
                      onChange={e => setCalcMode(prev => ({ ...prev, [key]: +e.target.value }))}
                      className="w-16 px-2 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1 pb-0.5">
                  <span className="text-xs text-gray-400">ΔТ, °C</span>
                  {dtArith ? (
                    <span className="text-sm font-bold text-kermi-heat px-1">= {dtArith.toFixed(0)}</span>
                  ) : (
                    <span className="text-sm font-medium text-brand-red px-1">Ошибка</span>
                  )}
                </div>
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Быстрый выбор</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => {
                  const isActive = calcMode.t1 == preset.t1 && calcMode.t2 == preset.t2 && calcMode.tv == preset.tv;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setCalcMode({ t1: preset.t1, t2: preset.t2, tv: preset.tv })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveStep('table')}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mt-2"
            >
              Перейти к подбору
            </button>
          </div>
        </AccordionSection>

        {/* Step 3: Table */}
        <AccordionSection
          id="table"
          activeStep={activeStep}
          onOpen={setActiveStep}
          title="Подбор радиатора"
          summary={selectedCell ? `В${selectedCell.height} × Д${selectedCell.length} мм` : 'Выберите размер'}
        >
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary-light border-t-primary rounded-full animate-spin" />
            </div>
          ) : radiators.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm text-muted-foreground">Нет данных для выбранных параметров</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Загрузите данные через панель администратора</p>
            </div>
          ) : (
            <HeatTable
              radiators={radiators}
              calcMode={calcMode}
              passportDtln={passportDtln}
              selectedCell={selectedCell}
              onCellSelect={handleCellSelect}
            />
          )}
        </AccordionSection>

        {/* Articles section */}
        {showArticles && selectedCell && (
          <div ref={articlesRef} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Артикулы — В{selectedCell.height} × Д{selectedCell.length} мм
              </h3>
            </div>
            {selectedRadiators.length === 0 ? (
              <p className="text-sm text-muted-foreground">Артикулы не найдены для выбранного размера</p>
            ) : (
              <MobileArticleList
                radiators={selectedRadiators}
                calcMode={calcMode}
                passportMode={passportMode}
                passportDtln={passportDtln}
                onArticleCopied={handleArticleCopied}
              />
            )}
          </div>
        )}

      </div>


    </div>
  );
}