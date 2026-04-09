import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-emerald-100 bg-white/50 backdrop-blur-sm hover:border-emerald-300 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
