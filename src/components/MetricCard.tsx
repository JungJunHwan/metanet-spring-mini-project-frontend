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
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 px-6 pt-1"
            >
              <Skeleton className="h-8 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/4" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-baseline gap-1"
            >
              <span className="text-2xl font-bold text-slate-900">{value}</span>
              {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
