import React, { useCallback } from 'react';
import WidgetCore from '@/components/widget/WidgetCore';
import { base44 } from '@/api/base44Client';

export default function Widget() {
  const loadRadiatorsFn = useCallback((series, type) =>
    base44.functions.invoke('getPublicRadiators', { series, type })
      .then(resp => resp.data.radiators || []),
  []);

  return <WidgetCore loadRadiatorsFn={loadRadiatorsFn} />;
}