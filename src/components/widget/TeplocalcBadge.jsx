import React from 'react';

export default function TeplocalcBadge() {
  return (
    <a
      href="https://teplocalc.ru"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium text-muted-foreground hover:text-brand-green transition-colors whitespace-nowrap"
    >
      Создано в <span className="underline">Teplocalc.ru</span>
    </a>
  );
}