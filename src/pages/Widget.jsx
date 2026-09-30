import React from 'react';
import WidgetCore from '@/components/widget/WidgetCore';
import { base44 } from '@/api/base44Client';

export default function Widget() {
  const loadRadiatorsFn = (series, type) =>
    base44.entities.Radiator.filter({ series, radiator_type: type }, 'height', 500);

  const searchArticleFn = (article) =>
    base44.entities.Radiator.filter({ article }, '-created_date', 1).then(r => r[0] || null);

  return <WidgetCore loadRadiatorsFn={loadRadiatorsFn} searchArticleFn={searchArticleFn} />;
}