import { useState } from 'react';

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  data: ChartData[];
  type: 'bar' | 'donut';
  title: string;
  subtitle?: string;
}

const PALETTE = [
  { bg: '#00D492', ring: 'ring-emerald-400', class: 'bg-emerald-400' }, // Electric Mint
  { bg: '#0099D8', ring: 'ring-sky-400', class: 'bg-sky-400' },         // Ocean Azure
  { bg: '#2563EB', ring: 'ring-blue-500', class: 'bg-blue-500' },       // Sapphire Blue
  { bg: '#F59E0B', ring: 'ring-amber-400', class: 'bg-amber-400' },     // Amber Gold
  { bg: '#EF4444', ring: 'ring-rose-400', class: 'bg-rose-400' },       // Coral Red
  { bg: '#00C4CC', ring: 'ring-cyan-400', class: 'bg-cyan-400' },       // Cyan
  { bg: '#8B5CF6', ring: 'ring-purple-400', class: 'bg-purple-400' }    // Purple
];

export function AnalyticsChart({ data, type, title, subtitle }: AnalyticsChartProps) {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);
  const maxVal = Math.max(...data.map((d) => d.value), 0);

  // SVG Donut metrics
  const radius = 54;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="glass-panel p-5 sm:p-6 h-full flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10 shrink-0">
          Total: {totalValue}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-gray-500 text-xs font-medium">
            No data available for this metric
          </div>
        ) : type === 'bar' ? (
          /* ===== MODERN BAR CHART ===== */
          <div className="w-full h-full flex flex-col justify-end">
            <div className="flex-1 flex items-end justify-around gap-2 sm:gap-4 min-h-[180px] pb-2 border-b border-slate-200 dark:border-white/10">
              {data.map((item, index) => {
                const heightPercent = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                const paletteItem = PALETTE[index % PALETTE.length];
                const isHovered = activeSegment === index;

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className="flex flex-col items-center flex-1 max-w-[56px] h-full justify-end relative group cursor-pointer"
                  >
                    {/* Tooltip */}
                    <div
                      className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                        isHovered
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-95 translate-y-1'
                      } bg-slate-900 dark:bg-dark-950 text-white shadow-xl border border-slate-700/60 dark:border-white/10`}
                    >
                      {item.label}: <span className="text-sky-400">{item.value}</span>
                      {totalValue > 0 && (
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({Math.round((item.value / totalValue) * 100)}%)
                        </span>
                      )}
                    </div>

                    {/* Bar track & fill */}
                    <div className="w-full h-full flex items-end justify-center rounded-t-xl bg-slate-100/90 dark:bg-white/[0.04] overflow-hidden p-1 border-t border-x border-slate-200/50 dark:border-white/5 group-hover:border-sky-500/40 transition-colors">
                      <div
                        className="w-full rounded-t-lg transition-all duration-700 ease-out relative group-hover:brightness-110 shadow-sm"
                        style={{
                          height: `${heightPercent}%`,
                          minHeight: item.value > 0 ? '6px' : '0px',
                          backgroundColor: paletteItem.bg
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/20 rounded-t-lg" />
                      </div>
                    </div>

                    {/* Label below bar */}
                    <span
                      className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-gray-400 mt-2 text-center truncate w-full px-0.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                      title={item.label}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sub-label count row */}
            <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 dark:text-gray-500">
              <span>0 min</span>
              <span>{maxVal} max</span>
            </div>
          </div>
        ) : (
          /* ===== SVG VECTOR DONUT CHART ===== */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 w-full h-full">
            {/* SVG Ring */}
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                {/* Background Track Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-slate-100 dark:text-white/5"
                />

                {/* Segment Arcs */}
                {data.map((item, index) => {
                  const percent = totalValue > 0 ? item.value / totalValue : 0;
                  const dashLength = percent * circumference;
                  const dashSpace = circumference - dashLength;
                  const offset = accumulatedPercent * circumference;
                  accumulatedPercent += percent;

                  const paletteItem = PALETTE[index % PALETTE.length];
                  const isHovered = activeSegment === index;

                  return (
                    <circle
                      key={index}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={paletteItem.bg}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={`${dashLength} ${dashSpace}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      onMouseEnter={() => setActiveSegment(index)}
                      onMouseLeave={() => setActiveSegment(null)}
                      className="transition-all duration-300 cursor-pointer hover:opacity-90"
                      style={{
                        transformOrigin: 'center'
                      }}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {activeSegment !== null && data[activeSegment]
                    ? data[activeSegment].value
                    : totalValue}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {activeSegment !== null && data[activeSegment]
                    ? data[activeSegment].label
                    : 'Total'}
                </span>
              </div>
            </div>

            {/* Legend & Breakdown List */}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {data.map((item, index) => {
                const paletteItem = PALETTE[index % PALETTE.length];
                const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
                const isHovered = activeSegment === index;

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-100 dark:bg-white/10 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: paletteItem.bg }}
                      />
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 truncate">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {item.value}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200/60 dark:border-white/5 tabular-nums">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}