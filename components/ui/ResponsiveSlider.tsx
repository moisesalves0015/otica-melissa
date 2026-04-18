import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResponsiveCarouselProps {
  children: React.ReactNode[];
  className?: string;
  dotClassName?: string;
  activeBreakpoint?: 'sm' | 'md' | 'lg';
  autoplay?: boolean;
  autoplayInterval?: number;
}

export function ResponsiveSlider({ 
  children, 
  className,
  dotClassName,
  activeBreakpoint = 'lg',
  autoplay = false,
  autoplayInterval = 4000
}: ResponsiveCarouselProps) {
  // Check if we should activate the carousel based on breakpoint
  // Using a simple CSS-based activation is safer for SSR, 
  // but for Embla engine we use a hook
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      // lg: 1024px, md: 768px, sm: 640px
      const width = activeBreakpoint === 'lg' ? 1024 : 
                    activeBreakpoint === 'md' ? 768 : 640;
      setIsDesktop(window.innerWidth >= width);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [activeBreakpoint]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'center', 
    containScroll: false, 
    loop: false,
    active: !isDesktop,
    breakpoints: {
      '(min-width: 768px)': { align: 'start' }
    }
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onInit = useCallback((api: NonNullable<ReturnType<typeof useEmblaCarousel>[1]>) => {
    if (api) setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback((api: NonNullable<ReturnType<typeof useEmblaCarousel>[1]>) => {
    if (api) setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  // Autoplay Logic
  useEffect(() => {
    if (!emblaApi || !autoplay) return;

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [emblaApi, autoplay, autoplayInterval, scrollNext]);

  // CSS Logic:
  // On Desktop (lg): Grid
  // On Mobile/Tablet (< lg): Carousel
  
  return (
    <div className={cn("w-full group", className)}>
      {/* Viewport */}
      <div 
        className={cn(
          "overflow-hidden",
          activeBreakpoint === 'lg' ? "lg:overflow-visible" : ""
        )} 
        ref={emblaRef}
      >
        <div 
          className={cn(
            "flex",
            activeBreakpoint === 'lg' ? "lg:grid lg:grid-cols-4 lg:gap-5" : ""
          )}
        >
          {children.map((child, index) => (
            <div 
              key={index} 
              className={cn(
                "min-w-0 flex-[0_0_85%] md:flex-[0_0_45%] mr-4 last:mr-0 lg:mr-0 lg:flex-none",
                activeBreakpoint === 'lg' ? "lg:w-full" : ""
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots - Only visible on Mobile/Tablet */}
      <div 
        className={cn(
          "flex items-center justify-center gap-2 mt-4",
          activeBreakpoint === 'lg' ? "lg:hidden" : ""
        )}
      >
        {scrollSnaps.map((_, index: number) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-1.5 transition-all duration-300 rounded-full bg-slate-200 hover:bg-slate-300",
              selectedIndex === index ? "w-6 bg-primary" : "w-1.5",
              dotClassName
            )}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
