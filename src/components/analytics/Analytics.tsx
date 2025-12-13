import React from 'react';
import { Card } from '../ui/Card';
import { Milk, Droplets, Clock, Hash, Calendar, Zap } from 'lucide-react';
import { displayVolume, getUnitLabel } from '../../lib/utils';

interface AnalyticsProps {
    logs: any[];
    inventory: any[];
    volumeUnit: 'ml' | 'oz';
}

export const Analytics: React.FC<AnalyticsProps> = ({ logs, inventory, volumeUnit }) => {
    // Helper to check if a date is today
    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Calculate Daily Stats
    const dailyLogs = logs.filter(log => isToday(log.timestamp));

    const dailyStats = {
        feedings: dailyLogs.filter(l => l.type === 'feeding').length,
        bottleVolume: dailyLogs
            .filter(l => l.type === 'feeding' && l.subType === 'bottle')
            .reduce((sum, l) => sum + (l.amount || 0), 0),
        pumpedVolume: dailyLogs
            .filter(l => l.type === 'pumping')
            .reduce((sum, l) => sum + (l.amount || 0), 0),
        nursingTime: dailyLogs
            .filter(l => l.type === 'feeding' && l.subType === 'breast')
            .reduce((sum, l) => sum + (l.totalDuration || 0), 0) / 60, // convert seconds to minutes
    };

    // Calculate All Time Stats
    const allTimeStats = {
        totalFeedings: logs.filter(l => l.type === 'feeding').length,
        totalBottleVolume: logs.filter(l => l.type === 'feeding' && l.subType === 'bottle').reduce((sum, l) => sum + (l.amount || 0), 0),
        totalPumpedVolume: logs.filter(l => l.type === 'pumping').reduce((sum, l) => sum + (l.amount || 0), 0),
        totalNursingTime: logs.filter(l => l.type === 'feeding' && l.subType === 'breast').reduce((sum, l) => sum + (l.totalDuration || 0), 0) / 60, // minutes
        totalDiapers: logs.filter(l => l.type === 'diaper').length,
        totalSleep: logs.filter(l => l.type === 'sleep').reduce((sum, l) => sum + (l.duration || 0), 0), // minutes
        inventoryCount: inventory.length,
        inventoryVolume: inventory.reduce((sum, item) => sum + (item.volume || 0), 0),
    };

    const formatDuration = (minutes: number) => {
        const hrs = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Statistics</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Insights for Today and All Time</p>
            </header>

            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={18} className="text-primary-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Today</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                            <Hash size={16} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{dailyStats.feedings}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Total Feedings</p>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                            <Milk size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{displayVolume(dailyStats.bottleVolume, volumeUnit)}<span className="text-sm text-gray-500 ml-1">{getUnitLabel(volumeUnit)}</span></span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Bottle Volume</p>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                            <Droplets size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{displayVolume(dailyStats.pumpedVolume, volumeUnit)}<span className="text-sm text-gray-500 ml-1">{getUnitLabel(volumeUnit)}</span></span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Pumped Volume</p>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="bg-pink-100 dark:bg-pink-900/30 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                            <Clock size={16} className="text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(dailyStats.nursingTime)}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Nursing Time</p>
                        </div>
                    </Card>
                </div>
            </section>

            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Zap size={18} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">All Time</h3>
                </div>
                <Card className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Total Feedings</span>
                        <span className="font-bold text-gray-900 dark:text-white">{allTimeStats.totalFeedings}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Total Bottle Vol.</span>
                        <span className="font-bold text-gray-900 dark:text-white">{displayVolume(allTimeStats.totalBottleVolume, volumeUnit)} {getUnitLabel(volumeUnit)}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Total Pumped Vol.</span>
                        <span className="font-bold text-gray-900 dark:text-white">{displayVolume(allTimeStats.totalPumpedVolume, volumeUnit)} {getUnitLabel(volumeUnit)}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Total Nursing Time</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatDuration(allTimeStats.totalNursingTime)}</span>
                    </div>

                    <div className="px-4 py-3 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Milk Storage Bags</span>
                        <span className="font-bold text-gray-900 dark:text-white">{allTimeStats.inventoryCount}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Milk Storage Vol.</span>
                        <span className="font-bold text-gray-900 dark:text-white">{displayVolume(allTimeStats.inventoryVolume, volumeUnit)} {getUnitLabel(volumeUnit)}</span>
                    </div>

                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Total Diapers</span>
                        <span className="font-bold text-gray-900 dark:text-white">{allTimeStats.totalDiapers}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-600 dark:text-gray-300 text-sm">Total Sleep Logged</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatDuration(allTimeStats.totalSleep)}</span>
                    </div>
                </Card>
            </section>
        </div>
    );
};
