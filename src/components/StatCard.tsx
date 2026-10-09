import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from 'lucide-react';
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
  isHero?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  isHero = false,
  onClick,
  subtitle
}: StatCardProps) {
  const colorConfig = {
    purple: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/25',
    blue: 'text-sky-400 bg-sky-500/15 border-sky-500/25',
    green: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
    orange: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
    red: 'text-rose-400 bg-rose-500/15 border-rose-500/25'
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

  const displayValue = isNumeric
    ? animatedValue
    : stringMatch
    ? `${animatedStringNum}${stringMatch[2]}`
    : value;

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -2
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`stat-card glass-card p-4 sm:p-5 flex flex-col justify-between rounded-2xl border border-white/10 transition-all ${
        isHero ? 'hero-card' : ''
      } ${
        onClick
          ? 'cursor-pointer hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 group active:scale-[0.98]'
          : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="stat-title text-xs sm:text-sm font-semibold text-gray-400 truncate pr-2 group-hover:text-gray-200 transition-colors">
            {title}
          </h3>
          <div
            className={`stat-icon-wrapper stat-icon--${color} p-2 rounded-xl border ${selectedColor} shrink-0 shadow-sm group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <span className="stat-value text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
            {displayValue}
          </span>

          {trend && (
            <div
              className={`trend-pill ${
                trend.isPositive ? 'trend-pill--positive' : 'trend-pill--negative'
              } flex items-center text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isHero ? 'hero-trend' : ''
              } ${
                trend.isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUpIcon className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
              ) : (
                <TrendingDownIcon className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
              )}
              <span>{trend.value}% vs last month</span>
            </div>
          )}
        </div>
      </div>

      {(subtitle || onClick) && (
        <div className="stat-footer mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
          <span className="stat-subtitle">{subtitle || 'Click to filter'}</span>
          {onClick && (
            <ArrowRightIcon className="h-3 w-3 text-sky-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      )}
    </motion.div>
  );
}