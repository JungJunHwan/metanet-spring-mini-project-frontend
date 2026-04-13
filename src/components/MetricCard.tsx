import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from './ui/Skeleton';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  delay?: number;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  delay = 0,
  isLoading = false 
}) => {
  return (
    <Card className="border-emerald-100 bg-white/50 backdrop-blur-sm hover:border-emerald-300 transition-colors overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative h-[60px]">
        {isLoading ? (
          <div className="absolute inset-0 px-6 pt-1">
            <Skeleton className="h-8 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : (
          <div className="flex items-baseline gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
