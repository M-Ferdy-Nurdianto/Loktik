import React from 'react';

/**
 * Editorial Streetwear Tag Badge - Sleek Uniform rounded-md Corners
 */
export const Badge = ({ children, variant = 'green', className = '' }) => {
  const styles = {
    green: 'bg-brand-green/20 text-brand-green border border-brand-green/40 font-extrabold',
    purple: 'bg-brand-purple/20 text-brand-purple border border-brand-purple/40 font-extrabold',
    blue: 'bg-brand-blue/20 text-brand-blue border border-brand-blue/40 font-extrabold',
    yellow: 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 font-extrabold',
    red: 'bg-brand-red/20 text-brand-red border border-brand-red/40 font-extrabold',
    orange: 'bg-brand-orange/20 text-brand-orange border border-brand-orange/50 font-extrabold',
    white: 'bg-white text-black font-extrabold',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-widest rounded-md select-none font-mono
        ${styles[variant] || styles.green}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
