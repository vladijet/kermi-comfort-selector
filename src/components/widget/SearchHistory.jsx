import React from 'react';
import { History } from 'lucide-react';

const KEY = 'kermi_article_history';

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function saveToHistory(article) {
  const next = [article, ...loadHistory().filter(a => a !== article)].slice(0, 10);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}

export default function SearchHistory({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        <History size={14} /> История поиска
      </p>
      <div className="flex flex-col">
        {items.map(a => (
          <button
            key={a}
            onClick={() => onSelect(a)}
            className="text-left px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}