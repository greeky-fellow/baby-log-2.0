import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 dark:border-gray-700/30 p-4 ${className}`}>
    {children}
  </div>
);
