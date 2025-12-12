import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    className?: string;
    disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = "", disabled = false }) => {
    const baseStyle = "px-4 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm focus:ring-4 focus:ring-primary-500/20 outline-none";
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 dark:bg-primary-600 dark:hover:bg-primary-500 dark:disabled:bg-primary-400 shadow-lg shadow-primary-900/10",
        secondary: "bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border border-red-100 dark:border-red-900/20",
        ghost: "bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};
