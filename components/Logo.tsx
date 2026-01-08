import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'large' | 'medium' | 'small';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'large' }) => {
  // Sizes: Large for Landing, Medium for Headers/Setup, Small for compact
  const sizeClasses = {
    large: 'text-6xl sm:text-8xl', // Increased size for landing
    medium: 'text-4xl sm:text-5xl',
    small: 'text-2xl'
  };

  const currentSize = sizeClasses[size];
  
  const letterBase = "inline-block text-transparent bg-clip-text bg-cover bg-center select-none transform hover:scale-110 transition-transform duration-300 drop-shadow-sm";

  // New vibrant solid/gradient styles to improve readability while keeping it fun
  const letters = [
    { 
      char: 'S', 
      style: { 
        // Vibrant Red-Orange
        backgroundImage: 'linear-gradient(to bottom right, #ef4444, #f97316)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
    { 
      char: 'p', 
      style: { 
        // Deep Sky Blue
        backgroundImage: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
    { 
      char: 'l', 
      style: { 
        // Lime Green
        backgroundImage: 'linear-gradient(to bottom right, #84cc16, #16a34a)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
    { 
      char: 'a', 
      style: { 
        // Golden Yellow
        backgroundImage: 'linear-gradient(to bottom, #fbbf24, #d97706)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
    { 
      char: 's', 
      style: { 
        // Cyan/Teal
        backgroundImage: 'linear-gradient(to bottom right, #06b6d4, #0e7490)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
    { 
      char: 'h', 
      style: { 
        // Hot Pink/Purple
        backgroundImage: 'linear-gradient(to bottom, #f472b6, #9333ea)',
        WebkitBackgroundClip: 'text',
        paddingRight: '0.05em'
      } 
    },
  ];

  return (
    <h1 className={`font-black tracking-tighter leading-none ${currentSize} ${className} flex items-baseline justify-center flex-wrap gap-x-1`}>
      <span className="text-slate-800 tracking-tight mr-2">Color</span>
      <span className="inline-flex">
        {letters.map((l, i) => (
          <span 
            key={i} 
            className={`${letterBase}`}
            style={l.style}
          >
            {l.char}
          </span>
        ))}
      </span>
    </h1>
  );
};