import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Milk, Droplets, Layers, Moon, RotateCcw, Baby } from 'lucide-react';
import { displayVolume, getUnitLabel, formatTimeAgo, formatTimeShort } from '../../lib/utils';
import { HistoryLog } from '../history/HistoryLog';

interface DashboardProps {
    logs: any[];
    visibleCategories: Record<string, boolean>;
    volumeUnit: 'ml' | 'oz';
    onDeleteLog: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, visibleCategories, volumeUnit, onDeleteLog }) => {
    const [summaryView, setSummaryView] = useState('last');

    const today = new Date().toDateString();
    const todaysLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);

    const lastBottleFeed = logs.find(l => l.type === 'feeding' && l.subType === 'bottle');
    const lastBreastFeed = logs.find(l => l.type === 'feeding' && l.subType === 'breast');

    // Stats Calculations
    const stats = {
        fedTime: logs.find(l => l.type === 'feeding')?.timestamp,
        diaperTime: logs.find(l => l.type === 'diaper')?.timestamp,
        sleepTime: logs.find(l => l.type === 'sleep')?.timestamp,
        pumpTime: logs.find(l => l.type === 'pumping')?.timestamp,
        lastBreastSide: lastBreastFeed?.lastSide || (lastBreastFeed?.leftDuration > lastBreastFeed?.rightDuration ? 'Left' : 'Right') || '-',
        totalFeedingSessions: todaysLogs.filter(l => l.type === 'feeding').length,
        totalBreastMin: todaysLogs.filter(l => l.type === 'feeding' && l.subType === 'breast').reduce((acc, curr) => acc + (curr.totalDuration || 0), 0) / 60,
        totalBottleBM: todaysLogs.filter(l => l.type === 'feeding' && l.subType === 'bottle' && l.contents === 'bm').reduce((acc, curr) => acc + (curr.amount || 0), 0),
        totalBottleFormula: todaysLogs.filter(l => l.type === 'feeding' && l.subType === 'bottle' && l.contents === 'formula').reduce((acc, curr) => acc + (curr.amount || 0), 0),
        totalDiapers: todaysLogs.filter(l => l.type === 'diaper').length,
        totalSleep: todaysLogs.filter(l => l.type === 'sleep').reduce((acc, curr) => acc + (curr.duration || 0), 0),
        totalPumped: todaysLogs.filter(l => l.type === 'pumping').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* ... (view toggle) */}

            <div className="min-h-[220px]">
                {summaryView === 'last' && (
                    <div className="grid grid-cols-2 gap-3">
                        {visibleCategories.feeding && (
                            <>
                                <Card className="col-span-2">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600"><Milk size={20} /></div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Feeding</p>
                                            <div className="space-y-1">
                                                {lastBottleFeed && (
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{displayVolume(lastBottleFeed.amount, volumeUnit)} {getUnitLabel(volumeUnit)}</span> by bottle • {formatTimeAgo(lastBottleFeed.timestamp)}
                                                    </p>
                                                )}
                                                {lastBreastFeed && (
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{Math.round((lastBreastFeed.totalDuration || 0) / 60)} min</span> on <span className="font-medium text-gray-700 dark:text-gray-300">{lastBreastFeed.lastSide === 'L' ? 'Left' : lastBreastFeed.lastSide === 'R' ? 'Right' : 'Unknown'}</span> breast • {formatTimeAgo(lastBreastFeed.timestamp)}
                                                    </p>
                                                )}
                                                {!lastBottleFeed && !lastBreastFeed && (
                                                    <p className="text-gray-400 text-xs italic">No feeding logs yet</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                        {visibleCategories.pumping && (
                            <Card>
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Droplets size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Pumped</p>
                                        <p className="text-sm text-gray-500">{formatTimeAgo(stats.pumpTime)}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                        {visibleCategories.diaper && (
                            <Card>
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Layers size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Diaper</p>
                                        <p className="text-sm text-gray-500">{formatTimeAgo(stats.diaperTime)}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                        {visibleCategories.sleep && (
                            <Card>
                                <div className="flex items-start gap-3">
                                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Moon size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Sleep</p>
                                        <p className="text-sm text-gray-500">{formatTimeAgo(stats.sleepTime)}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {summaryView === 'today' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {visibleCategories.feeding && (
                            <>
                                <Card className="py-3 px-4 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Total Feeds</p>
                                            <p className="text-xl font-bold mt-1 dark:text-white">{stats.totalFeedingSessions} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">sessions</span></p>
                                        </div>
                                        <div className="bg-yellow-50 p-2 rounded-full text-yellow-600"><Milk size={20} /></div>
                                    </div>
                                </Card>
                                <Card className="py-3 px-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Breastfeeding</p>
                                    <p className="text-xl font-bold mt-1 dark:text-white">{Math.round(stats.totalBreastMin)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">min</span></p>
                                </Card>
                                <Card className="py-3 px-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Bottle • BM</p>
                                    <p className="text-xl font-bold mt-1 dark:text-white">{displayVolume(stats.totalBottleBM, volumeUnit)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{getUnitLabel(volumeUnit)}</span></p>
                                </Card>
                                <Card className="py-3 px-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Bottle • Formula</p>
                                    <p className="text-xl font-bold mt-1 dark:text-white">{displayVolume(stats.totalBottleFormula, volumeUnit)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{getUnitLabel(volumeUnit)}</span></p>
                                </Card>
                            </>
                        )}
                        {visibleCategories.pumping && (
                            <Card className="py-3 px-4">
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Total Pumped</p>
                                <p className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">{displayVolume(stats.totalPumped, volumeUnit)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{getUnitLabel(volumeUnit)}</span></p>
                            </Card>
                        )}
                        {visibleCategories.sleep && (
                            <Card className="py-3 px-4">
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide font-bold">Sleep</p>
                                <p className="text-xl font-bold mt-1 dark:text-white">{stats.totalSleep} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">min</span></p>
                            </Card>
                        )}
                        {visibleCategories.diaper && (
                            <Card className="py-3 px-4 col-span-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-wide font-bold">Diapers</p>
                                        <p className="text-xl font-bold mt-1">{stats.totalDiapers}</p>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded-full text-purple-600"><Baby size={20} /></div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {summaryView === 'history' && (
                    <HistoryLog logs={logs} visibleCategories={visibleCategories} onDelete={onDeleteLog} volumeUnit={volumeUnit} />
                )}
            </div>
        </div>
    );
};
