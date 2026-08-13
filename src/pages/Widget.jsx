import React from 'react';
import WidgetCore from '@/components/widget/WidgetCore';
import { base44 } from '@/api/base44Client';

export default function Widget() {
  const loadRadiatorsFn = (series, type) =>
    base44.entities.Radiator.filter({ series, radiator_type: type }, 'height', 500);

  return <WidgetCore loadRadiatorsFn={loadRadiatorsFn} />;
}