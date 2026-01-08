import React, { useEffect, useRef } from 'react';

interface ColorPaletteProps {
  palette: string[];
  activeColorIndex: number;
  unlockedColorIndex: number; // Kept for interface compat but unused
  onSelectColor: (index: number) => void;
  completedColors: boolean[]; // Which colors are fully done
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ 
  palette, 
  activeColorIndex, 
  onSelectColor,
  completedColors
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active color
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.children[activeColorIndex] as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeColorIndex]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200; // Adjust scroll distance as needed
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 pb-6 shadow-2xl z-50">
      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Palette</span>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
            Color {activeColorIndex + 1} of {palette.length}
          </span>
        </div>
        
        <div className="relative group">
            {/* Scroll Left Button */}
            <button 
                onClick={() => handleScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:scale-110 transition-all border border-slate-100 hidden sm:flex"
                aria-label="Scroll left"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {palette.map((color, idx) => {
                const isCompleted = completedColors[idx];
                const isActive = idx === activeColorIndex;
                
                return (
                <button
                    key={idx}
                    onClick={() => onSelectColor(idx)}
                    className={`
                    flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center
                    transition-all duration-300 transform snap-center relative cursor-pointer
                    ${isActive ? 'scale-110 ring-4 ring-indigo-400 shadow-lg z-10' : 'scale-100 hover:scale-105'}
                    opacity-100
                    `}
                    style={{ 
                    backgroundColor: color,
                    border: '2px solid rgba(0,0,0,0.1)'
                    }}
                >
                    {isCompleted ? (
                    <svg className="w-8 h-8 text-white/80 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    ) : (
                    <span 
                        className="font-black text-xl drop-shadow-md text-white/90"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                        {idx + 1}
                    </span>
                    )}
                </button>
                );
            })}
            </div>

             {/* Scroll Right Button */}
             <button 
                onClick={() => handleScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:scale-110 transition-all border border-slate-100 hidden sm:flex"
                aria-label="Scroll right"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};