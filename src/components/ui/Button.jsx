import React from 'react';

/**
 * Editorial Streetwear Action Button - Consistent rounded-md Design System
 */
export const Button = ({
  children,
  variant = 'green',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-brand-green text-black hover:bg-[#2eff05] font-black border border-brand-green/80 shadow-[0_0_15px_rgba(57,255,20,0.3)]',
    purple: 'bg-brand-purple text-white hover:bg-[#7c43f5] font-black border border-brand-purple/80 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    blue: 'bg-brand-blue text-black hover:bg-[#009fb9] font-black border border-brand-blue/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    yellow: 'bg-brand-yellow text-black hover:bg-[#ebd300] font-black border border-brand-yellow/80',
    red: 'bg-brand-red text-white hover:bg-[#e62020] font-black border border-brand-red/80',
    white: 'bg-white text-black hover:bg-neutral-200 font-black border border-white',
    dark: 'bg-neutral-900 text-white hover:bg-neutral-800 font-bold border border-neutral-700',
    outline: 'bg-transparent text-white border border-neutral-700 hover:border-brand-green hover:text-brand-green font-bold',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs tracking-wider rounded-md',
    md: 'px-5 py-2.5 text-sm tracking-wider rounded-md',
    lg: 'px-7 py-3.5 text-base tracking-widest rounded-md',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-sans uppercase transition-all duration-200
        active:scale-[0.98] hover:-translate-y-0.5
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none disabled:shadow-none
        ${variantStyles[variant] || variantStyles.green}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
