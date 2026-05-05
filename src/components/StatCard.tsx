import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend
}: StatCardProps) {
  const colorConfig = {
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20'
  };
  const selectedColor = colorConfig[color];
  // Animate numeric values; pass through strings (like "75%")
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(isNumeric ? value : 0);
  // For string values like "75%", extract number and suffix
  const stringMatch =
  typeof value === 'string' ? value.match(/^(\d+)(.*)$/) : null;
  const animatedStringNum = useCountUp(
    stringMatch ? parseInt(stringMatch[1]) : 0
  );
  const displayValue = isNumeric ?
  animatedValue :
  stringMatch ?
  `${animatedStringNum}${stringMatch[2]}` :
  value;
  return (
    <motion.div
      whileHover={{
        scale: 1.02
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      className="glass-card p-3.5 sm:p-5 flex flex-col">
      
      <div className="flex items-center justify-between mb-2.5 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-400 truncate pr-2">
          {title}
        </h3>
        <div
          className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border ${selectedColor} shrink-0`}>
          
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 sm:gap-3">
        <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
          {displayValue}
        </span>

        {trend &&
        <div
          className={`flex items-center text-[10px] sm:text-xs font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          
            {trend.isPositive ?
          <TrendingUpIcon className="h-3 w-3 mr-0.5 sm:mr-1" /> :

          <TrendingDownIcon className="h-3 w-3 mr-0.5 sm:mr-1" />
          }
            {trend.value}%
          </div>
        }
      </div>
    </motion.div>);

}