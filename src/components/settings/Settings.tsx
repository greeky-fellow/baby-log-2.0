import React from 'react';
import { Card } from '../ui/Card';
import { Sun, Moon, Scale, Milk, Droplets, Layers, Palette, ChevronLeft } from 'lucide-react';

interface SettingsProps {
    babyName: string;
    onSetBabyName: (name: string) => void;
    familyId: string;
    onSetFamilyId: (id: string) => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    volumeUnit: 'ml' | 'oz';
    onToggleVolumeUnit: () => void;
    visibleCategories: Record<string, boolean>;
    onToggleCategory: (cat: string) => void;
    onClose: () => void;
    logs: any[];
    onImportData: () => void;
}

const THEME_COLORS = [
    { name: 'Blue', vars: { 50: '239 246 255', 500: '59 130 246', 600: '37 99 235', 900: '30 58 138' } },
    { name: 'Rose', vars: { 50: '255 241 242', 500: '244 63 94', 600: '225 29 72', 900: '136 19 55' } },
    { name: 'Violet', vars: { 50: '245 243 255', 500: '139 92 246', 600: '124 58 237', 900: '76 29 149' } },
    { name: 'Emerald', vars: { 50: '236 253 245', 500: '16 185 129', 600: '5 150 105', 900: '6 78 59' } },
    { name: 'Amber', vars: { 50: '255 251 235', 500: '245 158 11', 600: '217 119 6', 900: '120 53 15' } },
];

const updateTheme = (colorName: string) => {
    const theme = THEME_COLORS.find(c => c.name === colorName);
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary-50', theme.vars[50]);
    root.style.setProperty('--color-primary-500', theme.vars[500]);
    root.style.setProperty('--color-primary-600', theme.vars[600]);
    root.style.setProperty('--color-primary-900', theme.vars[900]);
    root.style.setProperty('--color-primary-100', theme.vars[50]);
    root.style.setProperty('--color-primary-400', theme.vars[500]);
    root.style.setProperty('--color-primary-700', theme.vars[600]);
};

export const Settings: React.FC<SettingsProps> = ({
    babyName,
    onSetBabyName,
    familyId,
    onSetFamilyId,
    darkMode,
    onToggleDarkMode,
    volumeUnit,
    onToggleVolumeUnit,
    visibleCategories,
    onToggleCategory,
    onClose,
    logs,
    onImportData
}) => {
    const handleExport = () => {
        const headers = ['Timestamp', 'Type', 'Detail', 'Amount', 'Unit', 'Duration (min)', 'Notes'];
        const rows = logs.map(log => {
            const detail = log.subType || log.status || log.contents || '';
            const amount = log.amount || '';
            const duration = log.totalDuration ? Math.round(log.totalDuration / 60) : (log.duration || '');
            return [
                `"${new Date(log.timestamp).toLocaleString()}"`,
                log.type,
                detail,
                amount,
                amount ? volumeUnit : '',
                duration,
                `"${(log.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `baby_log_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const categoryConfig = {
        feeding: { icon: Milk, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Feeding' },
        pumping: { icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Pumping' },
        diaper: { icon: Layers, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Diaper' },
        sleep: { icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Sleep' },
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Configuration</h2>
            </div>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">General</h3>
                <Card className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Baby's Name / Title</label>
                        <input
                            type="text"
                            value={babyName}
                            onChange={(e) => onSetBabyName(e.target.value)}
                            className="w-full text-lg font-semibold bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-2 focus:ring-2 focus:ring-primary-500 dark:text-white"
                            placeholder="e.g. Baby Log"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family ID (Sync Key)</label>
                        <input
                            type="text"
                            value={familyId}
                            onChange={(e) => onSetFamilyId(e.target.value)}
                            className="w-full text-lg font-semibold bg-gray-50 dark:bg-gray-800 border-none rounded-lg p-2 focus:ring-2 focus:ring-primary-500 dark:text-white font-mono text-base"
                            placeholder="e.g. demo-family"
                        />
                        <p className="text-xs text-gray-500 mt-1">Share this ID to sync with other devices.</p>
                    </div>
                </Card>
            </section>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Data Management</h3>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-gray-900 dark:text-white block">Export Data</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Download all logs as CSV</span>
                        </div>
                        <button
                            onClick={handleExport}
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            Export CSV
                        </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                        <div>
                            <span className="font-medium text-gray-900 dark:text-white block">Import Legacy Data</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Import from 'old_logs.csv'</span>
                        </div>
                        <button
                            onClick={onImportData}
                            className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            Import Data
                        </button>
                    </div>
                </Card>
            </section>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Appearance</h3>
                <Card className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                                {darkMode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-orange-500" />}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
                        </div>
                        <button
                            onClick={onToggleDarkMode}
                            className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                                <Palette size={20} className="text-pink-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Accent Color</span>
                        </div>
                        <div className="flex gap-2 justify-between">
                            {THEME_COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => updateTheme(c.name)}
                                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: `rgb(${c.vars[500]})` }}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </section>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Preferences</h3>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                                <Scale size={20} className="text-teal-500" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Volume Unit</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => volumeUnit !== 'ml' && onToggleVolumeUnit()}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${volumeUnit === 'ml' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                mL
                            </button>
                            <button
                                onClick={() => volumeUnit !== 'oz' && onToggleVolumeUnit()}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${volumeUnit === 'oz' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                oz
                            </button>
                        </div>
                    </div>
                </Card>
            </section>
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Visibility</h3>
                <Card className="p-0 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    {Object.entries(categoryConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        const isVisible = visibleCategories[key];
                        return (
                            <div key={key} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${config.bg} ${config.color} dark:bg-opacity-20`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{config.label}</span>
                                </div>
                                <button
                                    onClick={() => onToggleCategory(key)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${isVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        );
                    })}
                </Card>
            </section>
        </div>
    );
};
