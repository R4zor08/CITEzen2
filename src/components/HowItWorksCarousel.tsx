import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from 'lucide-react';

export type HowItWorksStep = {
  number: number;
  title: string;
  description: string;
  quote?: string;
  tag?: string;
  icon: React.ElementType;
  bg?: string;
  borderHover?: string;
  iconBg?: string;
  iconColor?: string;
};

// Signature color palette & default tilt angles directly modeled after the fanned deck UI
const CARD_THEMES = [
  {
    bg: '#f04a3e', // Coral / Red (Card 1)
    tag: 'REGISTRATION',
    defaultRotate: -6,
    defaultY: 6
  },
  {
    bg: '#f97316', // Warm Orange (Card 2)
    tag: 'SECURE AUTH',
    defaultRotate: -3.5,
    defaultY: 2
  },
  {
    bg: '#eab308', // Sunny Yellow (Card 3)
    tag: 'DASHBOARD',
    defaultRotate: -1,
    defaultY: -4
  },
  {
    bg: '#c5cb7b', // Olive / Khaki Lime (Card 4)
    tag: 'SMART FORM',
    defaultRotate: 2.5,
    defaultY: 2
  },
  {
    bg: '#2dd4bf', // Soft Teal / Seafoam (Card 5)
    tag: 'ROUTING',
    defaultRotate: -2,
    defaultY: 4
  },
  {
    bg: '#a3e635', // Electric Lime Green (Card 6 - Elevated)
    tag: 'RESOLUTION',
    defaultRotate: 4,
    defaultY: -6
  },
  {
    bg: '#7dd3fc', // Powder Sky Blue (Card 7)
    tag: 'CLOSURE',
    defaultRotate: -1.5,
    defaultY: 4
  }
];

interface HowItWorksCarouselProps {
  steps: HowItWorksStep[];
}

export function HowItWorksCarousel({ steps }: HowItWorksCarouselProps) {
  const len = steps.length;
  // Default to index 5 (the vibrant lime card in front) or index 0
  const [activeIndex, setActiveIndex] = useState(5);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingFromCode = useRef(false);

  // Smooth scroll mobile track to given index
  const scrollMobileTo = (index: number) => {
    if (!mobileScrollRef.current) return;
    const container = mobileScrollRef.current;
    const cardEl = container.children[index] as HTMLElement | undefined;
    if (cardEl) {
      isScrollingFromCode.current = true;
      const scrollLeft =
        cardEl.offsetLeft - (container.clientWidth - cardEl.clientWidth) / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      setTimeout(() => {
        isScrollingFromCode.current = false;
      }, 400);
    }
  };

  const paginate = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => {
        const next = (prev + delta + len) % len;
        scrollMobileTo(next);
        return next;
      });
    },
    [len]
  );

  const goTo = useCallback(
    (target: number) => {
      const next = ((target % len) + len) % len;
      setActiveIndex(next);
      scrollMobileTo(next);
    },
    [len]
  );

  // Auto-play timer (pauses on hover or manual toggle)
  useEffect(() => {
    if (isPaused || hoveredIndex !== null) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, hoveredIndex, paginate]);

  // Sync mobile scroll events back to activeIndex
  const handleMobileScroll = () => {
    if (isScrollingFromCode.current || !mobileScrollRef.current) return;
    const container = mobileScrollRef.current;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDiff = Infinity;
    Array.from(container.children).forEach((child, idx) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.clientWidth / 2;
      const diff = Math.abs(center - childCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });
    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') paginate(-1);
    if (e.key === 'ArrowRight') paginate(1);
  };

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="How CITEzen Works Carousel">
      
      {/* Top Header Row (Integrates natively with the page) */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6 mb-6 sm:mb-10 lg:mb-12">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[var(--glass-bg)] text-[var(--landing-accent)] border border-[var(--border-color)] mb-3">
            How CITEzen Works
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
            They say it better
            <br className="hidden sm:inline" />
            <span className="text-[var(--text-secondary)]"> than we do</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-xs sm:text-base mt-2 max-w-xl leading-relaxed">
            Every student concern moves through an automated pipeline from registration to verified resolution.
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto">
          {/* Step Counter Pill */}
          <div className="flex items-center px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wider text-[var(--text-primary)] bg-[var(--glass-bg)] border border-[var(--border-color)] backdrop-blur-md">
            STEP 0{activeIndex + 1} / 0{len}
          </div>

          {/* Auto-play pause/resume toggle */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-[var(--border-color)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
            title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
            aria-label={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}>
            {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
          </button>

          {/* Prev Button */}
          <button
            type="button"
            onClick={() => paginate(-1)}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-[var(--border-color)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
            title="Previous step"
            aria-label="Previous step">
            <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => paginate(1)}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-[var(--border-color)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
            title="Next step"
            aria-label="Next step">
            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW (lg+): Fanned, overlapping deck of colorful cards across page
         ========================================================================= */}
      <div className="hidden lg:flex relative justify-center items-center py-6 xl:py-10 min-h-[350px] xl:min-h-[400px] overflow-visible">
        <div className="flex items-center justify-center w-full max-w-7xl px-2">
          {steps.map((step, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            const cardBg = step.bg || theme.bg;
            const isSelected = activeIndex === i;
            const isHovered = hoveredIndex === i;
            const isFocused = isSelected || isHovered;

            // Calculate z-index: hovered or selected is on top (40-50), otherwise base stack order
            const zIndex = isHovered ? 50 : isSelected ? 40 : 10 + i;

            // Calculate transform
            const rotate = reduceMotion ? 0 : isFocused ? 0 : theme.defaultRotate;
            const translateY = reduceMotion ? 0 : isFocused ? -24 : theme.defaultY;
            const scale = isFocused ? 1.06 : 1;

            const StepIcon = step.icon;
            const rawQuote = step.quote || step.description;
            const quoteText = rawQuote.replace(/^["“”]|["“”]$/g, '');
            const tagText = step.tag || theme.tag;

            return (
              <motion.div
                key={step.number}
                onClick={() => goTo(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  zIndex,
                  backgroundColor: cardBg
                }}
                animate={{
                  rotate,
                  y: translateY,
                  scale,
                  boxShadow: isFocused
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 2px rgba(255, 255, 255, 0.4)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.45)'
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 28
                }}
                className={`relative cursor-pointer shrink-0 lg:w-[172px] xl:w-[200px] 2xl:w-[225px] lg:h-[265px] xl:h-[305px] 2xl:h-[335px] rounded-2xl xl:rounded-3xl p-4.5 xl:p-6 flex flex-col justify-between transition-colors duration-200 select-none ${
                  i > 0 ? 'lg:-ml-9 xl:-ml-12 2xl:-ml-15' : ''
                }`}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Step ${step.number}: ${step.title}`}>
                
                {/* Top Quote (clean, breathing room just like reference photo) */}
                <div className="flex flex-col">
                  <p className="text-slate-950 font-extrabold text-sm xl:text-base 2xl:text-lg leading-snug tracking-tight">
                    "{quoteText}"
                  </p>
                </div>

                {/* Empty Space matching reference photo */}
                <div className="flex-1 min-h-[24px]" />

                {/* Bottom Metadata & Icon Badge */}
                <div className="mt-auto">
                  {/* Subtle Divider (matching reference photo) */}
                  <div className="border-t border-black/15 my-2.5 xl:my-3" />

                  <div className="flex items-center gap-2.5 xl:gap-3">
                    <div className="h-8 w-8 xl:h-9 xl:w-9 rounded-xl bg-white/85 shadow-sm border border-black/10 flex items-center justify-center shrink-0 text-slate-950">
                      <StepIcon className="h-4 w-4 xl:h-5 xl:w-5" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs xl:text-sm text-slate-950 truncate leading-tight">
                        {step.title}
                      </p>
                      <p className="text-[8.5px] xl:text-[10px] font-bold tracking-wider uppercase text-slate-800/80 truncate leading-tight mt-0.5">
                        {tagText}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MOBILE & TABLET VIEW (< lg): Horizontal touch snap scroll
         ========================================================================= */}
      <div className="lg:hidden">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-3 sm:px-4 scrollbar-hide -mx-3 sm:-mx-4 touch-pan-x">
          {steps.map((step, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            const cardBg = step.bg || theme.bg;
            const isSelected = activeIndex === i;
            const StepIcon = step.icon;
            const rawQuote = step.quote || step.description;
            const quoteText = rawQuote.replace(/^["“”]|["“”]$/g, '');
            const tagText = step.tag || theme.tag;

            return (
              <div
                key={step.number}
                onClick={() => goTo(i)}
                style={{ backgroundColor: cardBg }}
                className={`snap-center shrink-0 w-[78vw] sm:w-[320px] max-w-[340px] h-[270px] sm:h-[290px] rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected ? 'ring-2 ring-white/60 scale-[1.01]' : 'opacity-90'
                }`}>
                <div className="flex flex-col">
                  <p className="text-slate-950 font-extrabold text-sm sm:text-base leading-snug tracking-tight">
                    "{quoteText}"
                  </p>
                </div>

                <div className="mt-auto">
                  <div className="border-t border-black/15 my-3" />
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-white/85 shadow-sm border border-black/10 flex items-center justify-center shrink-0 text-slate-950">
                      <StepIcon className="h-4 w-4" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-950 truncate">
                        {step.title}
                      </p>
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-800/80 truncate">
                        {tagText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-[var(--text-primary)] shadow-md'
                : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[var(--text-muted)]/35 hover:bg-[var(--text-muted)]/60'
            }`}
            aria-label={`Jump to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
