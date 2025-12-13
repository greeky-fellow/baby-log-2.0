import confetti from 'canvas-confetti';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { AlertCircle } from 'lucide-react';

import { auth, db, appId, configMissing } from './lib/firebase';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { LogEntry } from './components/forms/LogEntry';
import { Settings } from './components/settings/Settings';
import { Analytics } from './components/analytics/Analytics';
import { FullHistory } from './components/history/FullHistory';
import { importLegacyLogs } from './utils/dataImport';
import { removeDuplicateLogs } from './utils/deduplication';

export interface MilkInventoryItem {
  id: string;
  volume: number;
  pumpDate: string;
  freezeDate: string;
  status: 'stored' | 'thawed' | 'consumed';
}

export default function BabyLog() {
  const [user, setUser] = useState<any>(null);

  // Data State
  const [logs, setLogs] = useState<any[]>([]);
  const [inventory, setInventory] = useState<MilkInventoryItem[]>([]);
  const [familyId, setFamilyId] = useState(() => localStorage.getItem('familyId') || 'demo-family');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [babyName, setBabyName] = useState(() => localStorage.getItem('babyName') || 'Baby Log');

  useEffect(() => { localStorage.setItem('babyName', babyName); }, [babyName]);

  // UI State
  const [currentView, setCurrentView] = useState('home');

  const [volumeUnit, setVolumeUnit] = useState<'ml' | 'oz'>('ml');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Confirmation State
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', action: null as (() => Promise<void>) | null });

  // Visibility State
  const [visibleCategories, setVisibleCategories] = useState(() => {
    const saved = localStorage.getItem('visibleCategories');
    return saved ? JSON.parse(saved) : {
      feeding: true,
      pumping: true,
      diaper: true,
      sleep: true
    };
  });

  useEffect(() => {
    localStorage.setItem('visibleCategories', JSON.stringify(visibleCategories));
  }, [visibleCategories]);


  // Auth & Sync
  useEffect(() => {
    if (configMissing) return;
    const initAuth = async () => {
      try { await signInAnonymously(auth); }
      catch (error) { console.error("Auth failed", error); setSyncStatus('error'); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || configMissing) return;
    setSyncStatus('syncing');
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'baby_logs'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(allLogs.filter((log: any) => log.familyId === familyId).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSyncStatus('idle');
    }, () => setSyncStatus('error'));
    return () => unsubscribe();
  }, [user, familyId]);

  useEffect(() => { localStorage.setItem('familyId', familyId); }, [familyId]);


  // Actions
  const requestConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmState({ isOpen: true, title, message, action });
  };

  const executeAction = async () => {
    if (confirmState.action) await confirmState.action();
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const saveLogToFirebase = async (type: string, data: any, customTimestamp: string | null = null) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'baby_logs'), {
      familyId, type, timestamp: customTimestamp || new Date().toISOString(), userId: user.uid, ...data
    });

    // Confetti 🎉
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b']
    });

    // Return to home after save
    setCurrentView('home');
  };

  const deleteLog = (logId: string) => {
    requestConfirm('Delete Entry?', 'This cannot be undone.', async () => {
      if (!user) return;
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'baby_logs', logId)); }
      catch (e) { console.error("Error deleting", e); }
    });
  };

  const toggleCategory = (cat: string) => setVisibleCategories((prev: any) => ({ ...prev, [cat]: !prev[cat as keyof typeof prev] }));

  // Inventory Actions
  const handleCheckIn = (item: Omit<MilkInventoryItem, 'id' | 'status'>) => {
    const newItem: MilkInventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      status: 'stored'
    };
    setInventory(prev => [...prev, newItem]);
    confetti({ particleCount: 50, spread: 50, colors: ['#60a5fa', '#93c5fd'] }); // Blue confetti for milk check-in
  };

  const handleCheckOut = (id: string, action: 'thaw' | 'delete') => {
    requestConfirm(action === 'thaw' ? 'Thaw Milk?' : 'Remove Item?', `Are you sure you want to ${action} this item?`, async () => {
      setInventory(prev => prev.filter(item => item.id !== id));
      // For now, we just remove it. In future, we could move to a 'thawed' list or create a log entry.
    });
  };

  // Import Actions
  const handleImport = () => {
    requestConfirm('Import Legacy Data?', 'This will import logs from "public/old_logs.csv". This may create duplicates if run multiple times.', async () => {
      if (!user) return;
      const result = await importLegacyLogs(familyId, user.uid);
      if (result.success) {
        confetti({ particleCount: 200, spread: 100, colors: ['#22c55e', '#3b82f6'] });
        alert(`Successfully imported ${result.count} logs!`);
        // Refresh logs? Or they sync automatically?
        // App seems to rely on snapshot if setup, but local state isn't directly updated here except via snapshot.
        // If snapshot listener is active, it should update.
        // Assuming onSnapshot is working.
      } else {
        alert('Import failed. Check console for details.');
      }
    });
  };


  // Deduplicate Actions
  const handleRemoveDuplicates = () => {
    requestConfirm('Remove Duplicate Logs?', 'This will search for and remove duplicate entries based on timestamp and type. This might take a moment.', async () => {
      if (!user) return;
      const result = await removeDuplicateLogs(familyId);
      if (result.success) {
        if (result.deletedCount > 0) {
          confetti({ particleCount: 150, spread: 80, colors: ['#f87171', '#ef4444'] });
          alert(`Removed ${result.deletedCount} duplicate entries.`);
        } else {
          alert('No duplicates found.');
        }
      } else {
        alert('Deduplication failed. Check console.');
      }
    });
  };

  if (configMissing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertCircle size={32} /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h1>
          <p className="text-gray-600 mb-6">The app can't connect to the database because the API keys are missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen font-sans flex flex-col transition-colors duration-300 bg-transparent">
        <div className="max-w-md mx-auto w-full min-h-screen relative flex flex-col">
          <ConfirmModal
            isOpen={confirmState.isOpen}
            title={confirmState.title}
            message={confirmState.message}
            onConfirm={executeAction}
            onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
          />

          <Header
            syncStatus={syncStatus}
            babyName={babyName}
            onOpenSettings={() => setCurrentView('settings')}
            onOpenHistory={() => setCurrentView('history')}
          />

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto pb-20">
            <div className="max-w-md mx-auto p-4 space-y-6">

              {currentView === 'home' && (
                <Dashboard
                  logs={logs}
                  visibleCategories={visibleCategories}
                  volumeUnit={volumeUnit}
                  onDeleteLog={deleteLog}
                />
              )}

              {currentView === 'log' && (
                <LogEntry
                  visibleCategories={visibleCategories}
                  volumeUnit={volumeUnit}
                  onSave={saveLogToFirebase}
                  onRequestConfirm={requestConfirm}
                  inventory={inventory}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
              )}

              {currentView === 'settings' && (
                <Settings
                  babyName={babyName}
                  onSetBabyName={setBabyName}
                  familyId={familyId}
                  onSetFamilyId={setFamilyId}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  volumeUnit={volumeUnit}
                  onToggleVolumeUnit={() => setVolumeUnit(prev => prev === 'ml' ? 'oz' : 'ml')}
                  visibleCategories={visibleCategories}
                  onToggleCategory={toggleCategory}
                  onClose={() => setCurrentView('home')}
                  logs={logs}
                  onImportData={handleImport}
                  onRemoveDuplicates={handleRemoveDuplicates}
                />
              )}

              {currentView === 'history' && (
                <FullHistory
                  logs={logs}
                  onDelete={deleteLog}
                  onClose={() => setCurrentView('home')}
                  volumeUnit={volumeUnit}
                />
              )}

              {currentView === 'analytics' && (
                <Analytics
                  logs={logs}
                  inventory={inventory}
                  volumeUnit={volumeUnit}
                />
              )}

            </div>
          </div>

          {/* BOTTOM NAV */}
          <div className="fixed bottom-0 inset-x-0 z-50">
            <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 shadow-lg px-6 py-2 pb-6 flex justify-around items-center">
              <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-primary-600 dark:text-primary-400 scale-105 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                <span className="text-[10px] uppercase tracking-wide">Home</span>
              </button>
              <button onClick={() => setCurrentView('log')} className="flex flex-col items-center gap-1 -mt-10 relative group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all outline outline-[6px] outline-transparent ${currentView === 'log' ? 'bg-primary-600 shadow-primary-900/40 scale-105' : 'bg-slate-900 shadow-slate-900/30'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="16" /><line x1="8" x2="16" y1="12" y2="12" /></svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full mt-1">Log</span>
              </button>
              <button onClick={() => setCurrentView('analytics')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'analytics' ? 'text-primary-600 dark:text-primary-400 scale-105 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>
                <span className="text-[10px] uppercase tracking-wide">Stats</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
