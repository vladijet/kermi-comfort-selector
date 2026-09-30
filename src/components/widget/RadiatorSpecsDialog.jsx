import React from 'react';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ArticleDecodeTable from '@/components/widget/ArticleDecodeTable';

export default function RadiatorSpecsDialog({ radiator }) {
  return (
    <Dialog>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button className="flex-shrink-0" aria-label="Технические данные">
                <FileText size={18} className="text-primary hover:text-primary-dark transition-colors" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-white border-0 text-xs">
            Технические данные
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Технические данные</DialogTitle>
        </DialogHeader>
        <ArticleDecodeTable radiator={radiator} />
      </DialogContent>
    </Dialog>
  );
}