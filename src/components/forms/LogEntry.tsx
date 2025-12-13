import React, { useState, useRef, useEffect } from 'react';
import { Clock, Minus, Plus, Droplets } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getIsoNow, formatTime, displayVolume, getUnitLabel, adjustVolume, toLocalIsoString } from '../../lib/utils';

import type { MilkInventoryItem } from '../../App';

interface LogEntryProps {
    visibleCategories: Record<string, boolean>;
    volumeUnit: 'ml' | 'oz';
    onSave: (type: string, data: any, timestamp?: string) => void;
    onRequestConfirm: (title: string, message: string, action: () => Promise<void>) => void;
    inventory: MilkInventoryItem[];
    onCheckIn: (item: Omit<MilkInventoryItem, 'id' | 'status'>) => void;
    onCheckOut: (id: string, action: 'thaw' | 'delete') => void;
}

export const LogEntry: React.FC<LogEntryProps> = ({ visibleCategories, volumeUnit, onSave, onRequestConfirm, inventory, onCheckIn, onCheckOut }) => {
    const [activeTab, setActiveTab] = useState('feeding');

    // --- LOGGING STATES ---
    const [feedType, setFeedType] = useState('breast');

    // Breast Timer
    const [breastMode, setBreastMode] = useState('timer');
    const [leftTimer, setLeftTimer] = useState(0);
    const [rightTimer, setRightTimer] = useState(0);
    const [activeTimer, setActiveTimer] = useState<string | null>(null);
    const [timerStartTime, setTimerStartTime] = useState('');
    const [lastActiveSide, setLastActiveSide] = useState<string | null>(null);
    const timerIntervalRef = useRef<any>(null);
    const lastTickRef = useRef(Date.now());

    // Manual Breast Input
    const [manualBreastSide, setManualBreastSide] = useState('left');
    const [manualBreastStart, setManualBreastStart] = useState('');
    const [manualBreastEnd, setManualBreastEnd] = useState('');
    const [manualBreastDuration, setManualBreastDuration] = useState(15);

    // Feeding - Bottle
    const [bottleType, setBottleType] = useState('bm');
    const [bottleAmount, setBottleAmount] = useState(90);
    const [bottleTime, setBottleTime] = useState('');

    // Pumping
    const [pumpingTab, setPumpingTab] = useState<'log' | 'inventory'>('log');
    const [inventoryTab, setInventoryTab] = useState<'check-in' | 'check-out'>('check-in');
    const [pumpAmount, setPumpAmount] = useState(100);
    const [pumpTime, setPumpTime] = useState('');

    // Inventory Form
    const [invVolume, setInvVolume] = useState(150);
    const [invPumpDate, setInvPumpDate] = useState('');
    const [invFreezeDate, setInvFreezeDate] = useState('');

    // Sleep
    const [sleepMode, setSleepMode] = useState('quick');
    const [manualSleepStart, setManualSleepStart] = useState('');
    const [manualSleepEnd, setManualSleepEnd] = useState('');

    // Initialize times
    useEffect(() => {
        const isoString = getIsoNow();
        setPumpTime(isoString);
        setInvPumpDate(isoString);
        setInvFreezeDate(isoString.split('T')[0]); // Date only for freeze date
        setBottleTime(isoString);
        setManualBreastStart(isoString);
        setManualBreastEnd(isoString);
        setManualSleepStart(isoString);
        setManualSleepEnd(isoString);
        setTimerStartTime(isoString);
    }, []);

    // Timer Logic
    // Timer Persistence & Logic
    useEffect(() => {
        const saved = localStorage.getItem('breastTimerState');
        if (saved) {
            try {
                const s = JSON.parse(saved);
                const now = Date.now();
                // If a timer was running, add the elapsed time since last tick
                let additionalTime = 0;
                if (s.activeTimer && s.lastTick) {
                    additionalTime = (now - s.lastTick) / 1000;
                }

                if (s.leftTimer || s.leftTimer === 0) setLeftTimer(s.leftTimer + (s.activeTimer === 'left' ? additionalTime : 0));
                if (s.rightTimer || s.rightTimer === 0) setRightTimer(s.rightTimer + (s.activeTimer === 'right' ? additionalTime : 0));

                if (s.timerStartTime) setTimerStartTime(s.timerStartTime);
                if (s.lastActiveSide) setLastActiveSide(s.lastActiveSide);

                // Set active timer last to trigger the interval effect
                if (s.activeTimer) setActiveTimer(s.activeTimer);
            } catch (e) {
                console.error("Failed to restore timer", e);
            }
        }
    }, []);

    // Persist state on every change
    useEffect(() => {
        const state = {
            activeTimer,
            leftTimer,
            rightTimer,
            timerStartTime,
            lastActiveSide,
            lastTick: Date.now()
        };
        localStorage.setItem('breastTimerState', JSON.stringify(state));
    }, [activeTimer, leftTimer, rightTimer, timerStartTime, lastActiveSide]);

    useEffect(() => {
        if (activeTimer) {
            lastTickRef.current = Date.now();
            timerIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const delta = (now - lastTickRef.current) / 1000;
                lastTickRef.current = now;

                if (activeTimer === 'left') setLeftTimer(t => t + delta);
                if (activeTimer === 'right') setRightTimer(t => t + delta);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [activeTimer]);


    const toggleTimer = (side: string) => {
        if (leftTimer === 0 && rightTimer === 0 && !activeTimer) {
            setTimerStartTime(getIsoNow());
        }
        setLastActiveSide(side === 'left' ? 'L' : 'R');
        setActiveTimer(activeTimer === side ? null : side);
    };

    const resetTimers = () => { setActiveTimer(null); setLeftTimer(0); setRightTimer(0); setLastActiveSide(null); };

    const handleTimerStartChange = (newTime: string) => {
        const oldTimeObj = new Date(timerStartTime);
        const newTimeObj = new Date(newTime);
        const diffSeconds = (oldTimeObj.getTime() - newTimeObj.getTime()) / 1000;

        if (leftTimer > 0 || (leftTimer === 0 && rightTimer === 0)) {
            setLeftTimer(prev => Math.max(0, prev + diffSeconds));
        } else {
            setRightTimer(prev => Math.max(0, prev + diffSeconds));
        }
        setTimerStartTime(newTime);
    };

    // Manual Logic Handlers
    const handleManualBreastStartChange = (newStart: string) => {
        setManualBreastStart(newStart);
        if (newStart && manualBreastDuration >= 0) {
            const startDate = new Date(newStart);
            const endDate = new Date(startDate.getTime() + manualBreastDuration * 60000);
            setManualBreastEnd(toLocalIsoString(endDate));
        }
    };

    const handleManualBreastEndChange = (newEnd: string) => {
        setManualBreastEnd(newEnd);
        if (newEnd && manualBreastStart) {
            const startDate = new Date(manualBreastStart);
            const endDate = new Date(newEnd);
            const diffMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
            if (diffMins >= 0) {
                setManualBreastDuration(diffMins);
            }
        }
    };

    const handleManualDurChange = (newDur: number) => {
        const d = Math.max(0, newDur);
        setManualBreastDuration(d);
        if (manualBreastStart) {
            const startDate = new Date(manualBreastStart);
            const endDate = new Date(startDate.getTime() + d * 60000);
            setManualBreastEnd(toLocalIsoString(endDate));
        }
    };


    // Action Wrappers
    const saveBreastFeed = () => {
        onRequestConfirm('Save Feed?', 'Are you sure you want to log this feeding?', async () => {
            if (breastMode === 'timer') {
                if (leftTimer === 0 && rightTimer === 0) return;
                let lastSide = lastActiveSide;
                if (!lastSide) lastSide = rightTimer > 0 ? 'R' : 'L';

                onSave('feeding', {
                    subType: 'breast',
                    leftDuration: leftTimer,
                    rightDuration: rightTimer,
                    totalDuration: leftTimer + rightTimer,
                    lastSide: lastSide
                }, new Date(timerStartTime).toISOString());
                resetTimers();
            } else {
                const timestamp = new Date(manualBreastStart).toISOString();
                // Calculate duration from start/end if possible, else use duration spinner
                let durationSec = manualBreastDuration * 60;
                if (manualBreastEnd) {
                    const startInfo = new Date(manualBreastStart).getTime();
                    const endInfo = new Date(manualBreastEnd).getTime();
                    if (endInfo > startInfo) {
                        durationSec = (endInfo - startInfo) / 1000;
                    }
                }

                onSave('feeding', {
                    subType: 'breast',
                    leftDuration: manualBreastSide === 'left' ? durationSec : 0,
                    rightDuration: manualBreastSide === 'right' ? durationSec : 0,
                    totalDuration: durationSec,
                    lastSide: manualBreastSide === 'left' ? 'L' : 'R',
                    manual: true
                }, timestamp);
            }
        });
    };

    const saveBottleFeed = () => {
        onRequestConfirm('Save Bottle?', `Log ${displayVolume(bottleAmount, volumeUnit)} ${getUnitLabel(volumeUnit)} bottle feed?`, async () => {
            const timestamp = new Date(bottleTime).toISOString();
            onSave('feeding', {
                subType: 'bottle',
                contents: bottleType,
                amount: bottleAmount
            }, timestamp);
        });
    };

    const savePumpSession = () => {
        onRequestConfirm('Save Pump?', `Log ${displayVolume(pumpAmount, volumeUnit)} ${getUnitLabel(volumeUnit)} pumping session?`, async () => {
            const timestamp = new Date(pumpTime).toISOString();
            onSave('pumping', { amount: pumpAmount }, timestamp);
        });
    };

    const saveSleep = (durationMinutes: number | null = null) => {
        const msg = durationMinutes ? `Log ${durationMinutes} min sleep?` : 'Log sleep session?';
        onRequestConfirm('Log Sleep?', msg, async () => {
            if (sleepMode === 'quick' && durationMinutes) {
                onSave('sleep', { duration: durationMinutes });
            } else {
                const start = new Date(manualSleepStart);
                const end = new Date(manualSleepEnd);
                const diffMs = end.getTime() - start.getTime();
                const diffMins = Math.round(diffMs / 60000);
                if (diffMins > 0) {
                    onSave('sleep', { duration: diffMins }, start.toISOString());
                }
            }
        });
    };

    const saveDiaper = (diaperType: string) => {
        onRequestConfirm('Log Diaper?', `Log a ${diaperType} diaper?`, async () => {
            const timestamp = new Date(pumpTime).toISOString();
            onSave('diaper', { status: diaperType }, timestamp);
        });
    };


    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-semibold mb-3 ml-1 text-gray-700 dark:text-gray-200">Add Entry</h2>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                {['feeding', 'pumping', 'diaper', 'sleep'].filter(t => visibleCategories[t]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold capitalize flex-1 whitespace-nowrap transition-colors border ${activeTab === tab ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{tab}</button>
                ))}
            </div>

            <Card className="p-1 min-h-[400px]">
                {/* Feeding */}
                {activeTab === 'feeding' && (
                    <div className="p-2 space-y-6">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl transition-colors">
                            <button onClick={() => setFeedType('breast')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${feedType === 'breast' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Breast</button>
                            <button onClick={() => setFeedType('bottle')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${feedType === 'bottle' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Bottle</button>
                        </div>

                        {feedType === 'breast' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-1 rounded-lg inline-flex items-center transition-colors">
                                        <button onClick={() => setBreastMode('timer')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${breastMode === 'timer' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-300'}`}>Timer</button>
                                        <button onClick={() => setBreastMode('manual')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${breastMode === 'manual' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-300'}`}>Manual</button>
                                    </div>
                                </div>

                                {breastMode === 'timer' ? (
                                    <div className="text-center space-y-8">
                                        <div>
                                            <div className="text-4xl font-mono font-bold text-gray-800 dark:text-gray-100 mb-2">{formatTime(leftTimer + rightTimer)}</div>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-left transition-colors">
                                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Started</label>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                                    <input
                                                        type="datetime-local"
                                                        value={timerStartTime}
                                                        onChange={(e) => handleTimerStartChange(e.target.value)}
                                                        className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-center gap-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <button onClick={() => toggleTimer('left')} className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold border-4 transition-all ${activeTimer === 'left' ? 'border-orange-400 bg-orange-50 text-orange-600 scale-105 shadow-lg' : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-300'}`}>L</button>
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{formatTime(leftTimer)}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <button onClick={() => toggleTimer('right')} className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold border-4 transition-all ${activeTimer === 'right' ? 'border-orange-400 bg-orange-50 text-orange-600 scale-105 shadow-lg' : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-300'}`}>R</button>
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{formatTime(rightTimer)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-4">
                                            <Button variant="primary" className="w-full" onClick={saveBreastFeed}>Save Entry</Button>
                                            <div className="flex gap-3">
                                                <Button variant="secondary" className="flex-1" onClick={resetTimers}>Reset</Button>
                                                <Button variant="secondary" className="flex-1" onClick={() => setActiveTimer(null)}>Pause</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Manual Inputs */}
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Start Time</label>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                                    <input
                                                        type="datetime-local"
                                                        value={manualBreastStart}
                                                        onChange={(e) => handleManualBreastStartChange(e.target.value)}
                                                        className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">End Time</label>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                                    <input
                                                        type="datetime-local"
                                                        value={manualBreastEnd}
                                                        onChange={(e) => handleManualBreastEndChange(e.target.value)}
                                                        className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setManualBreastSide('left')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${manualBreastSide === 'left' ? 'border-black bg-black text-white dark:bg-white dark:text-black' : 'border-gray-200 text-gray-500'}`}>Left</button>
                                                <button onClick={() => setManualBreastSide('right')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${manualBreastSide === 'right' ? 'border-black bg-black text-white dark:bg-white dark:text-black' : 'border-gray-200 text-gray-500'}`}>Right</button>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Duration</span>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => handleManualDurChange(manualBreastDuration - 5)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-gray-600 dark:text-gray-300"><Minus size={16} /></button>
                                                    <span className="text-xl font-bold w-16 text-center text-gray-800 dark:text-gray-100">{manualBreastDuration} m</span>
                                                    <button onClick={() => handleManualDurChange(manualBreastDuration + 5)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow flex items-center justify-center text-gray-600 dark:text-gray-300"><Plus size={16} /></button>
                                                </div>
                                            </div>
                                            <Button variant="primary" className="w-full" onClick={saveBreastFeed}>Save Entry</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                                {/* Bottle Form */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-1 rounded-xl flex">
                                    <button onClick={() => setBottleType('bm')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${bottleType === 'bm' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Breast Milk</button>
                                    <button onClick={() => setBottleType('formula')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${bottleType === 'formula' ? 'bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Formula</button>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Time</label>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                        <input
                                            type="datetime-local"
                                            value={bottleTime}
                                            onChange={(e) => setBottleTime(e.target.value)}
                                            className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center gap-2 mb-2">
                                    {[30, 60, 90, 120, 150].map(amt => (
                                        <button key={amt} onClick={() => setBottleAmount(amt)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center py-4">
                                    <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">{displayVolume(bottleAmount, volumeUnit)}</span>
                                    <span className="text-gray-400 text-lg font-medium ml-2">{getUnitLabel(volumeUnit)}</span>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button onClick={() => setBottleAmount(v => adjustVolume(v, 'subtract', volumeUnit))} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"><Minus size={24} /></button>
                                    <button onClick={() => setBottleAmount(v => adjustVolume(v, 'add', volumeUnit))} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"><Plus size={24} /></button>
                                </div>
                                <Button variant="primary" className="w-full" onClick={saveBottleFeed}>Save Bottle</Button>
                            </div>
                        )}

                    </div>
                )}

                {/* Pumping */}
                {activeTab === 'pumping' && (
                    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl transition-colors">
                            <button onClick={() => setPumpingTab('log')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${pumpingTab === 'log' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Log Expression</button>
                            <button onClick={() => setPumpingTab('inventory')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${pumpingTab === 'inventory' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Milk Inventory</button>
                        </div>

                        {pumpingTab === 'log' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Time</label>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                        <input
                                            type="datetime-local"
                                            value={pumpTime}
                                            onChange={(e) => setPumpTime(e.target.value)}
                                            className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center gap-2 mb-2">
                                    {[50, 80, 100, 120, 150].map(amt => (
                                        <button key={amt} onClick={() => setPumpAmount(amt)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center py-4">
                                    <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">{displayVolume(pumpAmount, volumeUnit)}</span>
                                    <span className="text-gray-400 text-lg font-medium ml-2">{getUnitLabel(volumeUnit)}</span>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button onClick={() => setPumpAmount(v => adjustVolume(v, 'subtract', volumeUnit))} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"><Minus size={24} /></button>
                                    <button onClick={() => setPumpAmount(v => adjustVolume(v, 'add', volumeUnit))} className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"><Plus size={24} /></button>
                                </div>
                                <Button variant="primary" className="w-full" onClick={savePumpSession}>Log Pump Session</Button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Inventory Sub-Tabs */}
                                <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-4">
                                    <button onClick={() => setInventoryTab('check-in')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${inventoryTab === 'check-in' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Check In</button>
                                    <button onClick={() => setInventoryTab('check-out')} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${inventoryTab === 'check-out' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Check Out</button>
                                </div>

                                {inventoryTab === 'check-in' ? (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4 uppercase tracking-wide">New Bag Details</h3>

                                            <div className="space-y-4">
                                                {/* Volume Selector */}
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Volume</label>
                                                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <button onClick={() => setInvVolume(v => adjustVolume(v, 'subtract', volumeUnit))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Minus size={14} /></button>
                                                        <span className="font-bold text-lg dark:text-white">{displayVolume(invVolume, volumeUnit)} {getUnitLabel(volumeUnit)}</span>
                                                        <button onClick={() => setInvVolume(v => adjustVolume(v, 'add', volumeUnit))} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><Plus size={14} /></button>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pump Date</label>
                                                        <input type="datetime-local" value={invPumpDate} onChange={e => setInvPumpDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Freeze Date</label>
                                                        <input type="date" value={invFreezeDate} onChange={e => setInvFreezeDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm dark:text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                                            if (!invPumpDate || !invFreezeDate) return;
                                            onCheckIn({ volume: invVolume, pumpDate: new Date(invPumpDate).toISOString(), freezeDate: invFreezeDate });
                                            // Reset to defaults slightly modified to allow rapid entry
                                            setInvVolume(150);
                                        }}>Check In Bag</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2 px-1">
                                            <span className="text-sm font-bold text-gray-500 uppercase">Stored Milk ({inventory.length})</span>
                                            <span className="text-xs text-gray-400">FIFO Order</span>
                                        </div>

                                        {inventory.length === 0 ? (
                                            <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                                <Droplets className="mx-auto mb-2 opacity-50" />
                                                <p>No milk in inventory.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                                {[...inventory].sort((a, b) => new Date(a.pumpDate).getTime() - new Date(b.pumpDate).getTime()).map((item, idx) => (
                                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center group relative overflow-hidden">
                                                        {idx === 0 && <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">OLDEST</div>}
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white">
                                                                {displayVolume(item.volume, volumeUnit)} {getUnitLabel(volumeUnit)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Pumped: {new Date(item.pumpDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => onCheckOut(item.id, 'thaw')}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors border border-blue-200"
                                                        >
                                                            Thaw
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Diaper */}
                {activeTab === 'diaper' && (
                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Time Change</label>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                <input
                                    type="datetime-local"
                                    value={pumpTime} // Using pumpTime as a generic timestamp since initialized to now
                                    onChange={(e) => setPumpTime(e.target.value)}
                                    className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 h-32">
                            <button onClick={() => saveDiaper('wet')} className="flex-1 rounded-2xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 flex flex-col items-center justify-center gap-3 transition-all group">
                                <Droplets size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-base text-blue-700 dark:text-blue-300">Wet</span>
                            </button>
                            <button onClick={() => saveDiaper('dirty')} className="flex-1 rounded-2xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800 flex flex-col items-center justify-center gap-3 transition-all group">
                                <div className="bg-amber-500 w-9 h-9 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform text-sm">💩</div>
                                <span className="font-bold text-base text-amber-700 dark:text-amber-300">Dirty</span>
                            </button>
                            <button onClick={() => saveDiaper('both')} className="flex-1 rounded-2xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 flex flex-col items-center justify-center gap-3 transition-all group">
                                <div className="flex -space-x-2 group-hover:scale-110 transition-transform">
                                    <div className="bg-blue-500 w-7 h-7 rounded-full flex items-center justify-center text-white"><Droplets size={14} /></div>
                                    <div className="bg-amber-500 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]">💩</div>
                                </div>
                                <span className="font-bold text-base text-purple-700 dark:text-purple-300">Both</span>
                            </button>
                        </div>
                    </div>
                )}
                {/* Sleep */}
                {activeTab === 'sleep' && (
                    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl transition-colors">
                            <button onClick={() => setSleepMode('quick')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sleepMode === 'quick' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Quick Log</button>
                            <button onClick={() => setSleepMode('manual')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${sleepMode === 'manual' ? 'bg-black dark:bg-white text-white dark:text-black shadow' : 'text-gray-500 dark:text-gray-400'}`}>Exact Time</button>
                        </div>
                        {sleepMode === 'quick' ? (
                            <div className="grid grid-cols-3 gap-3">
                                {[30, 45, 60, 90, 120, 180].map(m => (
                                    <button key={m} onClick={() => saveSleep(m)} className="py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">{m}m</button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Fell Asleep</label>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                        <input
                                            type="datetime-local"
                                            value={manualSleepStart}
                                            onChange={(e) => setManualSleepStart(e.target.value)}
                                            className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Woke Up</label>
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                                        <input
                                            type="datetime-local"
                                            value={manualSleepEnd}
                                            onChange={(e) => setManualSleepEnd(e.target.value)}
                                            className="bg-transparent font-medium text-gray-800 dark:text-gray-200 w-full outline-none"
                                        />
                                    </div>
                                </div>
                                <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => saveSleep()}>Log Sleep</Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
