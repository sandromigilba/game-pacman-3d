import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'blue' | 'yellow' | 'purple' | 'red' | 'none';
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = 'none',
  hoverGlow = false,
  className = '',
  ...props
}) => {
  const glowStyles = {
    blue: 'border-secondary/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]',
    yellow: 'border-primary/30 shadow-[0_0_20px_rgba(255,215,0,0.15)]',
    purple: 'border-accent/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    red: 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    none: 'border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  };

  const hoverEffect = hoverGlow 
    ? 'hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.25)] transition-all duration-300' 
    : '';

  return (
    <div
      className={`glass-panel ${glowStyles[glow]} ${hoverEffect} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
