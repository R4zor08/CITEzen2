interface ChartData {
  label: string;
  value: number;
  color?: string;
}
interface AnalyticsChartProps {
  data: ChartData[];
  type: 'bar' | 'donut';
  title: string;
}
export function AnalyticsChart({ data, type, title }: AnalyticsChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value));
  // Default colors if not provided
  const colors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-red-500'];

  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <h3 className="text-base font-semibold text-white mb-6">{title}</h3>

      <div className="flex-1 flex items-end justify-center gap-2 sm:gap-4 min-h-[200px] mt-auto">
        {type === 'bar' &&
        data.map((item, index) => {
          const height = maxVal > 0 ? `${item.value / maxVal * 100}%` : '0%';
          const colorClass = item.color || colors[index % colors.length];
          return (
            <div
              key={index}
              className="flex flex-col items-center group w-full max-w-[40px]">
              
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-dark-800 text-white text-xs py-1 px-2 rounded mb-2 whitespace-nowrap border border-white/10 pointer-events-none absolute -translate-y-10">
                  {item.value}
                </div>

                {/* Bar */}
                <div className="w-full h-full min-h-[200px] flex items-end relative rounded-t-md overflow-hidden bg-white/5">
                  <div
                  className={`w-full rounded-t-md transition-all duration-1000 ease-out ${colorClass}`}
                  style={{
                    height,
                    minHeight: item.value > 0 ? '4px' : '0'
                  }}>
                  
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>

                {/* Label */}
                <span
                className="text-[10px] sm:text-xs text-gray-400 mt-3 text-center truncate w-full px-1"
                title={item.label}>
                
                  {item.label}
                </span>
              </div>);

        })}

        {/* Simple CSS Donut Chart representation (since we can't easily do SVG arcs without a library) */}
        {type === 'donut' &&
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full h-full">
            <div className="relative w-40 h-40 rounded-full border-8 border-white/5 flex items-center justify-center">
              {/* Fake segments using borders - simplified for pure CSS */}
              <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent border-l-transparent rotate-45 opacity-80" />
              <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-b-transparent border-r-transparent -rotate-45 opacity-80" />

              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {data.reduce((a, b) => a + b.value, 0)}
                </div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {data.map((item, index) => {
              const colorClass = item.color || colors[index % colors.length];
              return (
                <div key={index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                    <span className="text-sm text-gray-300 flex-1 min-w-[100px]">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {item.value}
                    </span>
                  </div>);

            })}
            </div>
          </div>
        }
      </div>
    </div>);

}