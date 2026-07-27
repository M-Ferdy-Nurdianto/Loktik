import React from 'react';

/**
 * Editorial Streetwear Card Container - Consistent rounded-md Design System
 */
export const Card = ({
  children,
  variant = 'dark',
  hover = false,
  className = '',
}) => {
  const variantMap = {
    dark: 'bg-[#121212] text-white border border-neutral-800 rounded-md',
    light: 'bg-neutral-900 text-white border border-neutral-800 rounded-md',
    green: 'bg-brand-green/10 text-white border border-brand-green/40 rounded-md',
    purple: 'bg-brand-purple/10 text-white border border-brand-purple/40 rounded-md',
    blue: 'bg-brand-blue/10 text-white border border-brand-blue/40 rounded-md',
  };

  const hoverStyle = hover
    ? 'transition-all duration-300 hover:border-brand-green/60 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(57,255,20,0.15)]'
    : '';

  return (
    <div
      className={`
        p-6 relative overflow-hidden backdrop-blur-sm
        ${variantMap[variant] || variantMap.dark}
        ${hoverStyle}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
