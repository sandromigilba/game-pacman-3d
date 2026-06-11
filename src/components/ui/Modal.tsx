import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  glow?: 'blue' | 'yellow' | 'purple' | 'red' | 'none';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  glow = 'blue',
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050816]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-10 w-full max-w-lg"
          >
            <Card glow={glow} className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {title && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <h3 className="text-xl font-bold tracking-wider uppercase text-white neon-text-blue">
                    {title}
                  </h3>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="text-muted-text hover:text-white transition-colors cursor-pointer rounded-full p-2 hover:bg-white/5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className="text-left">{children}</div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default Modal;
