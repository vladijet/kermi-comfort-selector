import React, { useState, useEffect } from 'react';
import TemperaturePanel from '@/components/widget/TemperaturePanel';
import SeriesTypeSelector from '@/components/widget/SeriesTypeSelector';
import HeatTable from '@/components/widget/HeatTable';
import ArticleList from '@/components/widget/ArticleList';
import { base44 } from '@/api/base44Client';
import { TYPES_BY_SERIES, calcDtln } from '@/lib/radiatorData';

export default function Widget() {
  const [series, setSeries] = useState('profil');
  const [type, setType] = useState(22);
  const [calcMode, setCalcMode] = useState({ t1: 75, t2: 65, tv: 20 });
  const [passportMode, setPassportMode] = useState({ t1: 105, t2: 75, tv: 20 });
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
    base44.entities.Radiator.filter(
      { series, radiator_type: type },
      'height',
      500
    ).then(data => {
      setRadiators(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [series, type]);

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

  const handleSeriesChange = (newSeries) => {
    setSeries(newSeries);
    setType(TYPES_BY_SERIES[newSeries][0]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full" />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">Kermi Comfort</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Подбор стальных панельных радиаторов</p>
          </div>
        </div>

        {/* Temperature mode */}
        <TemperaturePanel
          calcMode={calcMode}
          onChange={setCalcMode}
          passportMode={passportMode}
          onPassportChange={setPassportMode}
        />

        {/* Main content area */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Selectors + Table */}
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-5">

              {/* Series & Type */}
              <SeriesTypeSelector
                series={series}
                type={type}
                onSeriesChange={handleSeriesChange}
                onTypeChange={setType}
              />

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
                  onCellSelect={setSelectedCell}
                />
              )}
            </div>
          </div>

          {/* Right: Radiator image */}
          <div className="lg:w-56 xl:w-64">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden sticky top-4">
              <div className="aspect-[4/5] bg-secondary flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Изображение радиатора</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {series === 'profil' ? `Профиль Тип ${type}` : `План Тип ${type}`}
                  </p>
                </div>
              </div>
              {selectedCell && (
                <div className="px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground font-medium">Выбрано</p>
                  <p className="text-sm font-bold text-brand-green mt-0.5">
                    В{selectedCell.height} × Д{selectedCell.length} мм
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Article list */}
        {selectedCell && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
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