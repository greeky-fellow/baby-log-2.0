import React from 'react';
import { Wifi, Settings, History } from 'lucide-react';

interface HeaderProps {
    syncStatus: 'idle' | 'syncing' | 'error';
    babyName: string;
    onOpenSettings: () => void;
    onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    syncStatus,
    babyName,
    onOpenSettings,
    onOpenHistory
}) => {
    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-30 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none">{babyName}</h1>
                    {syncStatus === 'syncing' && <Wifi className="animate-pulse text-primary-500" size={14} />}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onOpenHistory} className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <History size={18} />
                    </button>
                    <button onClick={onOpenSettings} className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
