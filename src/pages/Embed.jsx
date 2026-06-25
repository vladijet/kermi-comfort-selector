import React, { useEffect, useState, useCallback } from 'react';
import WidgetCore from '@/components/widget/WidgetCore';
import { base44 } from '@/api/base44Client';

const VISITOR_KEY = 'kermi_visitor_id';

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        (Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'guest-' + Date.now();
  }
}

export default function Embed() {
  const [uid, setUid] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get('uid'));
  }, []);

  useEffect(() => {
    if (!uid) return;
    base44.functions.invoke('getDealerConfig', { uid })
      .then(resp => {
        const data = resp.data;
        if (data.status === 'success') setConfig(data.dealer);
        else setError(data.details || 'Дилер не найден');
      })
      .catch(() => setError('Не удалось загрузить настройки виджета'));
  }, [uid]);

  const loadRadiatorsFn = useCallback((series, type) =>
    base44.functions.invoke('getPublicRadiators', { series, type })
      .then(resp => resp.data.radiators || []),
  []);

  const trackEventFn = useCallback((event_type) => {
    if (!config || !config.analytics_enabled) return;
    const visitor_id = getVisitorId();
    base44.functions.invoke('trackWidgetEvent', {
      dealer_uid: uid,
      visitor_id,
      event_type
    }).catch(() => {});
  }, [config, uid]);

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Виджет не сконфигурирован (отсутствует параметр uid).</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary-light border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <WidgetCore loadRadiatorsFn={loadRadiatorsFn} trackEventFn={trackEventFn} />;
}