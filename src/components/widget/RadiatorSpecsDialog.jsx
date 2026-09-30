import React from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ArticleDecodeTable from '@/components/widget/ArticleDecodeTable';

export default function RadiatorSpecsDialog({ radiator }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex-shrink-0" title="Смотреть характеристики">
          <Info size={18} className="text-muted-foreground hover:text-brand-green transition-colors" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Характеристики радиатора</DialogTitle>
        </DialogHeader>
        <ArticleDecodeTable radiator={radiator} />
      </DialogContent>
    </Dialog>
  );
}