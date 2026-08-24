import React from 'react';

export default function TeplocalcBadge() {
  return (
    <a
      href="https://teplocalc.ru"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-gray-200 bg-[#373a3f] border border-[#50545a] hover:bg-[#41454b] transition-colors whitespace-nowrap"
    >
      Создано в <span className="underline ml-1">Teplocalc.ru</span>
    </a>
  );
}