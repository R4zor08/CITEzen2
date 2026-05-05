import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

export type HowItWorksStep = {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  borderHover: string;
  iconBg: string;
  iconColor: string;
};

const SWIPE_PX = 48;

interface HowItWorksCarouselProps {
  steps: HowItWorksStep[];
}

export function HowItWorksCarousel({ steps }: HowItWorksCarouselProps) {
  const len = steps.length;
  const [[index, direction], setSlide] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const paginate = useCallback(
    (delta: number) => {
      setSlide((prev) => {
        const i = prev[0];
        const next = (i + delta + len) % len;
        return [next, delta > 0 ? 1 : -1];
      });
    },
    [len]
  );

  const goTo = useCallback(
    (target: number) => {
      const next = ((target % len) + len) % len;
      setSlide(([i]) => {
        if (next === i) return [i, 0];
        const forward = (next - i + len) % len;
        const dir = forward <= len / 2 ? 1 : -1;
        return [next, dir];
      });
    },
    [len]
  );

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => paginate(1), 5200);
    return () => clearInterval(t);
  }, [isPaused, paginate]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -SWIPE_PX) paginate(1);
    else if (dx > SWIPE_PX) paginate(-1);
  };

  const variants = {
    enter: (dir: number) => ({
      x: reduceMotion ? 0 : dir > 0 ? '100%' : '-100%',
      opacity: reduceMotion ? 1 : 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: reduceMotion ? 0 : dir < 0 ? '100%' : '-100%',
      opacity: reduceMotion ? 1 : 0
    })
  };

  const s = steps[index];
  const StepIcon = s.icon;

  return (
    <div
      className="relative max-w-4xl mx-auto select-none px-0 sm:px-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>
      {/* Mobile: shorter card; sm+: current larger layout */}
      <div className="relative min-h-[200px] max-h-[min(52vh,320px)] sm:max-h-none sm:min-h-[280px] md:min-h-[320px] lg:min-h-[340px] overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl touch-pan-y mx-auto max-w-[min(100%,20rem)] sm:max-w-none">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 340, damping: 36 },
              opacity: { duration: reduceMotion ? 0 : 0.22 }
            }}
            className={`absolute inset-0 glass-panel border border-white/10 shadow-lg sm:shadow-xl shadow-black/20 ${s.borderHover}`}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-3 sm:gap-8 md:gap-10 p-3.5 sm:p-8 md:p-10 lg:p-12 h-full overflow-y-auto custom-scrollbar">
              <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-0 shrink-0">
                <div
                  className={`relative w-12 h-12 sm:w-24 sm:h-24 md:w-[6.5rem] md:h-[6.5rem] rounded-xl sm:rounded-2xl ${s.iconBg} flex items-center justify-center border border-white/10 shadow-md sm:shadow-lg shadow-black/10`}>
                  <StepIcon
                    className={`h-6 w-6 sm:h-11 sm:w-11 md:h-14 md:w-14 ${s.iconColor}`}
                    strokeWidth={1.75}
                  />
                  <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-6 w-6 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] sm:text-sm font-bold text-white shadow-md sm:shadow-lg shadow-purple-500/35 border-2 border-[var(--bg-secondary)]">
                    {s.number}
                  </div>
                </div>
                <p className="sm:mt-3 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap">
                  Step {s.number}/{len}
                </p>
              </div>

              <div className="text-center sm:text-left flex-1 min-w-0 flex flex-col justify-center pb-0.5 sm:pb-1">
                <h3 className="text-base sm:text-2xl md:text-3xl font-bold text-white mb-1.5 sm:mb-4 leading-snug sm:leading-tight tracking-tight">
                  {s.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto sm:mx-0">
                  {s.description}
                </p>
                <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs text-gray-500 md:hidden">
                  Swipe to see more
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-3 sm:gap-5 mt-4 sm:mt-8 max-w-[min(100%,20rem)] sm:max-w-none mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-5 w-full">
          <button
            type="button"
            onClick={() => paginate(-1)}
            className="min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all shadow-sm sm:shadow-md touch-manipulation"
            aria-label="Previous step">
            <ChevronLeftIcon className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>

          <div
            className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 sm:gap-2.5 px-0.5 overflow-x-auto scrollbar-hide max-w-[min(100%,200px)] sm:max-w-none py-0.5 sm:py-1"
            role="tablist"
            aria-label="Carousel pagination">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => goTo(i)}
                className={`shrink-0 touch-manipulation rounded-full transition-all duration-300 flex items-center justify-center ${i === index ? 'h-2 w-7 sm:h-2.5 sm:w-10 bg-purple-500 shadow-sm sm:shadow-md shadow-purple-500/35' : 'h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 bg-white/25 hover:bg-white/45 active:scale-110'}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => paginate(1)}
            className="min-h-[40px] min-w-[40px] sm:min-h-[48px] sm:min-w-[48px] flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all shadow-sm sm:shadow-md touch-manipulation"
            aria-label="Next step">
            <ChevronRightIcon className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="w-full max-w-[16rem] sm:max-w-md px-0.5">
          <div className="h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
              initial={false}
              animate={{ width: `${((index + 1) / len) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
