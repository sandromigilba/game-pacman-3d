import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'glass',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none rounded-[30px] active:scale-[0.98] cursor-pointer tracking-wide select-none';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base font-bold uppercase tracking-widest',
  };

  const variantStyles = {
    primary: 'bg-primary text-[#050816] hover:bg-yellow-400 font-bold border border-primary/20 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]',
    secondary: 'bg-secondary text-[#050816] hover:bg-cyan-400 font-bold border border-secondary/20 shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)]',
    accent: 'bg-accent text-white hover:bg-purple-600 border border-accent/20 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]',
    danger: 'bg-red-500/20 text-red-300 hover:bg-red-500/40 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    ghost: 'bg-transparent hover:bg-white/5 border border-transparent text-white',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/25 shadow-lg',
  };

  const widthStyle = fullWidth ? 'w-full flex' : '';

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
export default Button;
