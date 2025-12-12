import React from 'react';
import { Card } from '../ui/Card';
import { Milk, Baby, Moon, Droplets, Activity, History, Trash2 } from 'lucide-react';
import { displayVolume, getUnitLabel } from '../../lib/utils';

// Helper to get log details (moved from App.tsx)
const getLogIcon = (type: string) => {
    switch (type) {
        case 'feeding': return <Milk size={16} />;
        case 'diaper': return <Baby size={16} />;
        case 'sleep': return <Moon size={16} />;
        case 'pumping': return <Droplets size={16} />;
        default: return <Activity size={16} />;
    }
};

const getLogDescription = (log: any, volumeUnit: 'ml' | 'oz') => {
    if (log.type === 'feeding') {
        if (log.subType === 'breast') {
            return `Breast ${log.lastSide ? `(${log.lastSide})` : ''} • ${Math.round(log.totalDuration / 60)}m`;
        }
        return `Bottle ${log.contents === 'bm' ? 'BM' : 'Formula'} (${displayVolume(log.amount, volumeUnit)}${getUnitLabel(volumeUnit)})`;
    }
    if (log.type === 'pumping') return `Pumped (${displayVolume(log.amount, volumeUnit)}${getUnitLabel(volumeUnit)})`;
    if (log.type === 'diaper') return `Diaper (${log.status})`;
    if (log.type === 'sleep') return `Sleep (${log.duration}m)`;
    return log.type;
};

interface HistoryLogProps {
    logs: any[];
    visibleCategories: Record<string, boolean>;
    onDelete: (id: string) => void;
    volumeUnit: 'ml' | 'oz';
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ logs, visibleCategories, onDelete, volumeUnit }) => {
    const filteredHistoryLogs = logs.filter(log => visibleCategories[log.type]);

    return (
        <Card className="p-0 overflow-hidden h-[400px] flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                <h3 className="font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">Activity Log</h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Latest 50</span>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
                {filteredHistoryLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm"><History size={32} className="mb-2 opacity-20" />No activity visible</div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredHistoryLogs.slice(0, 50).map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${log.type === 'feeding' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        log.type === 'diaper' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                            log.type === 'sleep' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                log.type === 'pumping' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {getLogIcon(log.type)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{getLogDescription(log, volumeUnit)}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => onDelete(log.id)} className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};
