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

  // Auto-resize iframe height for parent window
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';

    let lastHeight = 0;
    let timer = null;

    const sendHeight = () => {
      timer = null;
      const height = document.documentElement.scrollHeight;
      if (Math.abs(height - lastHeight) < 5) return;
      lastHeight = height;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(sendHeight, 300);
    };

    schedule();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUid(params.get('uid'));
  }, []);

  useEffect(() => {
    if (!uid) return;
    base44.functions.invoke('getDealerConfig', { uid })
      .then(resp => {
        const data = resp.data;
        if (data.status === 'success') {
          if (data.dealer.is_active === false) {
            setError('Сервис временно недоступен. Пожалуйста, обратитесь к администратору сайта.');
          } else {
            setConfig(data.dealer);
          }
        } else {
          setError(data.details || 'Дилер не найден');
        }
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