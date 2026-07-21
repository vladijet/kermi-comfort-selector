import React, { useState, useEffect } from 'react';
import TemperaturePanel from '@/components/widget/TemperaturePanel';
import SeriesTypeSelector from '@/components/widget/SeriesTypeSelector';
import HeatTable from '@/components/widget/HeatTable';
import ArticleList from '@/components/widget/ArticleList';
import MobileWizard from '@/components/widget/MobileWizard';
import { TYPES_BY_SERIES, calcDtln } from '@/lib/radiatorData';
import { useIsMobile } from '@/hooks/use-mobile';

export default function WidgetCore({ loadRadiatorsFn, trackEventFn, embed = false }) {
  const isMobile = useIsMobile();

  const [series, setSeries] = useState('profil');
  const [type, setType] = useState(22);
  const [calcMode, setCalcMode] = useState({ t1: 75, t2: 65, tv: 20 });
  const [passportMode, setPassportMode] = useState({ t1: 95, t2: 85, tv: 20 });
  const passportDtln = calcDtln(passportMode.t1, passportMode.t2, passportMode.tv);
  const [selectedCell, setSelectedCell] = useState(null);
  const [radiators, setRadiators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRadiators, setSelectedRadiators] = useState([]);

  // Load radiators when series or type changes
  useEffect(() => {
    setSelectedCell(null);
    setSelectedRadiators([]);
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
  }, [selectedCell, radiators]);

  // Smooth scroll to results block when a cell is selected
  useEffect(() => {
    if (!selectedCell) return;
    const resultsEl = document.querySelector('[data-results]');
    if (resultsEl) {
      setTimeout(() => {
        const top = resultsEl.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 150);
    }
  }, [selectedCell]);

  const handleSeriesChange = (newSeries) => {
    setSeries(newSeries);
    setType(TYPES_BY_SERIES[newSeries][0]);
  };

  const handleCellSelect = (cell) => {
    setSelectedCell(cell);
    trackEventFn?.('calculation_performed');
  };

  const handleArticleCopied = () => {
    trackEventFn?.('article_copied');
  };

  if (isMobile) {
    return <MobileWizard loadRadiatorsFn={loadRadiatorsFn} trackEventFn={trackEventFn} />;
  }

  return (
    <div className={`bg-background p-4 md:p-6 ${embed ? '' : 'min-h-screen'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full space-y-5">

        {/* Temperature mode */}
        <TemperaturePanel
          calcMode={calcMode}
          onChange={setCalcMode}
          passportMode={passportMode}
          onPassportChange={setPassportMode}
        />

        {/* Main content area */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-5">

          {/* Series & Type + Legend */}
          <div className="flex items-center gap-12 flex-wrap">
            <SeriesTypeSelector
              series={series}
              type={type}
              onSeriesChange={handleSeriesChange}
              onTypeChange={setType}
            />
            <div className="flex flex-col gap-1.5 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground leading-tight">Номинальный тепловой поток, Вт</span>
                <span className="text-[10px] text-muted-foreground/80 leading-tight">(при ΔТ=70°C, по ГОСТ Р 53583-2009)</span>
              </div>
              <div className="w-full border-t border-gray-300"></div>
              <span className="text-sm font-bold text-kermi-heat leading-tight">Расчётный тепловой поток, Вт</span>
            </div>
          </div>

          <div className="border-t border-gray-50" />

          {/* Table */}
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
        </div>

        {/* Article list */}
        {selectedCell && (
          <div data-results className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Доступные артикулы — В{selectedCell.height} × Д{selectedCell.length} мм
              </h3>
            </div>
            {selectedRadiators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Артикулы не найдены для выбранного размера</p>
            ) : (
              <ArticleList
                radiators={selectedRadiators}
                calcMode={calcMode}
                passportMode={passportMode}
                passportDtln={passportDtln}
                onArticleCopied={handleArticleCopied}
              />
            )}
          </div>
        )}

        {/* Footer hint */}
        {!selectedCell && radiators.length > 0 && (
          <p className="text-center text-xs text-gray-400 pb-2">
            Кликните на ячейку таблицы, чтобы увидеть доступные артикулы
          </p>
        )}
      </div>
    </div>
  );
}