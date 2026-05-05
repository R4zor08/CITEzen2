import type { LucideIcon } from 'lucide-react';
interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  isLast?: boolean;
}
export function StepCard({
  number,
  title,
  description,
  icon: Icon,
  isLast = false
}: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center text-center group">
      {/* Connecting Line (Desktop) */}
      {!isLast &&
      <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-500/50 to-transparent z-0" />
      }

      {/* Connecting Line (Mobile) */}
      {!isLast &&
      <div className="md:hidden absolute top-20 left-1/2 w-px h-16 bg-gradient-to-b from-purple-500/50 to-transparent z-0" />
      }

      <div className="relative z-10 flex flex-col items-center mb-8 md:mb-0">
        <div className="relative mb-6">
          {/* Number Badge */}
          <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-purple-500/30 z-20 border-2 border-dark-900">
            {number}
          </div>

          {/* Icon Container */}
          <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:bg-white/10 group-hover:border-purple-500/50 transition-all duration-300 group-hover:-translate-y-2 shadow-xl">
            <Icon className="h-8 w-8 text-gray-300 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>

        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-400 max-w-[200px]">{description}</p>
      </div>
    </div>);

}