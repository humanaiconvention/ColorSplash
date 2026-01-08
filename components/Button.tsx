import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 rounded-2xl font-bold text-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-md overflow-hidden";
  
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-indigo-500/30 border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1",
    secondary: "bg-white text-indigo-500 border-2 border-indigo-100 hover:bg-indigo-50",
    danger: "bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-700 active:border-b-0 active:translate-y-1",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Preserve width/height by keeping children rendered but invisible */}
      <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 font-medium">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Wait...</span>
        </span>
      )}
    </button>
  );
};