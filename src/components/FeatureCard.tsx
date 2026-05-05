import type { LucideIcon } from 'lucide-react';
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}
export function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0
}: FeatureCardProps) {
  return (
    <div
      className="glass-card p-4 sm:p-6 md:p-8 flex flex-col items-start group animate-slide-up aspect-square sm:aspect-auto justify-between sm:justify-start"
      style={{
        animationDelay: `${delay}ms`
      }}>
      
      <div className="mb-3 sm:mb-6 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon className="h-5 w-5 sm:h-8 sm:w-8 text-purple-400 relative z-10" />
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm sm:text-xl font-bold text-white mb-1.5 sm:mb-3 group-hover:text-purple-300 transition-colors leading-tight">
          {title}
        </h3>

        <p className="text-gray-400 text-xs sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-none">
          {description}
        </p>
      </div>
    </div>);

}