import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ArticleDecodeTable from '@/components/widget/ArticleDecodeTable';
import SearchHistory, { loadHistory, saveToHistory } from '@/components/widget/SearchHistory';

export default function ArticleSearchDialog({ searchArticleFn }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(loadHistory);

  const handleOpenChange = (value) => {
    setOpen(value);
    if (!value) {
      setQuery('');
      setResult(null);
      setError('');
    }
  };

  const runSearch = async (article) => {
    if (!article) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const found = await searchArticleFn(article);
      if (found) {
        setResult(found);
        setHistory(saveToHistory(found.article || article));
      } else setError('Артикул не найден');
    } catch {
      setError('Не удалось выполнить поиск');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(query.trim());
  };

  const handleHistorySelect = (article) => {
    setQuery(article);
    runSearch(article);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground underline underline-offset-2 hover:text-primary-dark transition-colors"
      >
        <Search size={14} />
        Поиск по артикулу
      </button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Поиск по артикулу</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Например FTV220400801R2C"
              autoFocus
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Найти
            </Button>
          </form>
          {error && <p className="text-sm text-brand-red">{error}</p>}
          {result && <ArticleDecodeTable radiator={result} />}
          {!result && !loading && <SearchHistory items={history} onSelect={handleHistorySelect} />}
        </DialogContent>
      </Dialog>
    </>
  );
}