import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Milk, Baby, Moon, Droplets, Activity, ChevronLeft, Trash2, Filter, ArrowUpDown, Calendar } from 'lucide-react';
import { displayVolume, getUnitLabel } from '../../lib/utils';

// Helper to get log details (duplicated from HistoryLog.tsx)
const getLogIcon = (type: string) => {
    switch (type) {
        case 'feeding': return <Milk size={18} />;
        case 'diaper': return <Baby size={18} />;
        case 'sleep': return <Moon size={18} />;
        case 'pumping': return <Droplets size={18} />;
        default: return <Activity size={18} />;
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

interface FullHistoryProps {
    logs: any[];
    onDelete: (id: string) => void;
    onClose: () => void;
    volumeUnit: 'ml' | 'oz';
}

export const FullHistory: React.FC<FullHistoryProps> = ({ logs, onDelete, onClose, volumeUnit }) => {
    const [filterType, setFilterType] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (filterType !== 'all') {
            result = result.filter(log => log.type === filterType);
        }
        if (startDate) {
            const start = new Date(startDate).setHours(0, 0, 0, 0);
            result = result.filter(log => new Date(log.timestamp).getTime() >= start);
        }
        if (endDate) {
            const end = new Date(endDate).setHours(23, 59, 59, 999);
            result = result.filter(log => new Date(log.timestamp).getTime() <= end);
        }
        return [...result].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [logs, filterType, sortOrder, startDate, endDate]);

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'feeding', label: 'Feeding' },
        { id: 'diaper', label: 'Diaper' },
        { id: 'sleep', label: 'Sleep' },
        { id: 'pumping', label: 'Pumping' },
    ];

    // Group logs by date
    const groupedLogs = useMemo(() => {
        const groups: Record<string, any[]> = {};
        filteredLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
        });
        return groups;
    }, [filteredLogs]);

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 bg-gray-50 dark:bg-black/20 rounded-t-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Full History</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowUpDown size={18} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="bg-white dark:bg-gray-900 px-4 pt-2 pb-4 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${filterType === f.id
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="bg-white dark:bg-gray-900 px-4 pb-6 border-b border-gray-100 dark:border-gray-800 flex gap-3">
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 w-full outline-none"
                    />
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 w-full outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.keys(groupedLogs).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                        <Filter size={48} className="mb-4 opacity-20" />
                        <p>No logs found</p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([date, dayLogs]) => (
                        <div key={date} className="animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <Calendar size={14} className="text-gray-400" />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{date}</h3>
                            </div>
                            <div className="space-y-2">
                                {dayLogs.map(log => (
                                    <Card key={log.id} className="p-3 flex items-center justify-between group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${log.type === 'feeding' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                log.type === 'diaper' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    log.type === 'sleep' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        log.type === 'pumping' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {getLogIcon(log.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{getLogDescription(log, volumeUnit)}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDelete(log.id)}
                                            className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 p-2 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
