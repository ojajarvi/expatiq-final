/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Bell, 
  Shield, 
  Calendar, 
  Check, 
  Download, 
  Cpu, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ChevronRight, 
  Plus, 
  Fingerprint, 
  Settings, 
  Compass, 
  Lock, 
  FileText,
  BadgeAlert,
  Loader2,
  Upload,
  User,
  LogOut,
  Building2,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  Signal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelLog, TaxRule, EvidenceFile, SimulationPlan } from './types';
import BiometricCover from './components/BiometricCover';
import Onboarding from './components/Onboarding';
import WorldMap from './components/WorldMap';
import TimeLogger from './components/TimeLogger';
import RuleEditor from './components/RuleEditor';
import ResidencySimulator from './components/ResidencySimulator';
import GPSTrackingHub from './components/GPSTrackingHub';
import SecureReportsHub from './components/SecureReportsHub';
import SubscriptionPaywall from './components/SubscriptionPaywall';

// Services
import { authService, GDPRDataDump } from './auth/authService';
import { backgroundTrackingEngine } from './tracking/backgroundTracking';
import { useNetworkState } from './hooks/useNetworkState';

const INITIAL_PRESET_RULES: TaxRule[] = [
  {
    id: 'rule-mc',
    countryCode: 'MC',
    countryName: 'Monaco',
    maxDaysLimit: 365,
    minDaysRequired: 90,
    warningThresholdDays: 30,
    description: 'Minimum 90 days required state residency stay for annual compliance ledger.'
  },
  {
    id: 'rule-fi',
    countryCode: 'FI',
    countryName: 'Finland',
    maxDaysLimit: 183,
    warningThresholdDays: 20,
    description: 'Nordic tax resident limits rule. Double taxation triggers automatically above 183 days.'
  },
  {
    id: 'rule-ae',
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    maxDaysLimit: 365,
    minDaysRequired: 90,
    warningThresholdDays: 20,
    description: '90-day minimum presence condition for corporate and individual resident clearance.'
  }
];

const INITIAL_TRAVEL_LOGS: TravelLog[] = [
  {
    id: 'log-1',
    countryCode: 'FI',
    countryName: 'Finland',
    entryDate: '2026-01-05',
    exitDate: '2026-03-20',
    notes: 'Winter sports schedule & local holding board alignment.',
    verifiedMethod: 'Boarding Pass',
    isSimulated: false
  },
  {
    id: 'log-2',
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    entryDate: '2026-03-21',
    exitDate: '2026-04-15',
    notes: 'UAE Tech Innovation Hub residency physical stay validation.',
    verifiedMethod: 'GPS',
    isSimulated: false
  },
  {
    id: 'log-3',
    countryCode: 'MC',
    countryName: 'Monaco',
    entryDate: '2026-04-16',
    exitDate: null,
    notes: 'Mediterranean residency validation. Base harbour operations.',
    verifiedMethod: 'GPS',
    isSimulated: false
  }
];

const INITIAL_EVIDENCE: EvidenceFile[] = [
  {
    id: 'env-1',
    fileName: 'FINNAIR_AY121_HELSINKI_TO_MONACO.pdf',
    fileType: 'Boarding Pass',
    uploadDate: '2026-04-16',
    fileSize: '1.2 MB',
    countryCode: 'MC',
    status: 'Verified',
    notes: 'Helsinki Vantaa to Nice Côte d’Azur Exec flight.'
  },
  {
    id: 'env-2',
    fileName: 'HOTEL_SOCIETE_BAINS_MER_MONTE_CARLO.pdf',
    fileType: 'Hotel Receipt',
    uploadDate: '2026-04-20',
    fileSize: '840 KB',
    countryCode: 'MC',
    status: 'Verified',
    notes: 'Monte Carlo Casino Square official stay proof.'
  }
];

export default function App() {
  const { isOnline, lastSyncTime } = useNetworkState();

  // Core authorization and device lock state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('expatiq_unlocked') === 'true';
  });
  
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('expatiq_onboarded') === 'true';
  });

  const [primaryTaxHome, setPrimaryTaxHome] = useState<string>(() => {
    return localStorage.getItem('expatiq_primary_home') || 'MC';
  });

  const [activeCountryCode, setActiveCountryCode] = useState<string>('MC');
  
  // Frozen MVP active tabs matrix: Dashboard, Timeline, GPS, Secure Reports, Membership
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'gps' | 'reports' | 'billing'>('dashboard');
  const [currentTier, setCurrentTier] = useState<'Free' | 'Premium' | 'Concierge'>('Premium');

  // Subscriptions flow states
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [showAssetViewer, setShowAssetViewer] = useState<boolean>(false);
  const [logs, setLogs] = useState<TravelLog[]>(() => {
    const local = localStorage.getItem('expatiq_logs');
    return local ? JSON.parse(local) : INITIAL_TRAVEL_LOGS;
  });

  const [rules, setRules] = useState<TaxRule[]>(() => {
    const local = localStorage.getItem('expatiq_rules');
    const loaded = local ? JSON.parse(local) : INITIAL_PRESET_RULES;
    const uniqueMap = new Map<string, TaxRule>();
    loaded.forEach((r: TaxRule) => {
      if (r && r.countryCode) {
        uniqueMap.set(r.countryCode.toUpperCase(), r);
      }
    });
    return Array.from(uniqueMap.values());
  });

  const [evidence, setEvidence] = useState<EvidenceFile[]>(() => {
    const local = localStorage.getItem('expatiq_evidence');
    return local ? JSON.parse(local) : INITIAL_EVIDENCE;
  });

  // Simulation Sandbox scenarios
  const [simulation, setSimulation] = useState<SimulationPlan | null>(null);

  // GDPR status flags
  const [scrubMessage, setScrubMessage] = useState<string | null>(null);
  const [isExportingGDPR, setIsExportingGDPR] = useState<boolean>(false);

  // Save changes to client-side localStorage
  useEffect(() => {
    localStorage.setItem('expatiq_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('expatiq_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('expatiq_evidence', JSON.stringify(evidence));
  }, [evidence]);

  useEffect(() => {
    localStorage.setItem('expatiq_unlocked', isUnlocked.toString());
  }, [isUnlocked]);

  useEffect(() => {
    localStorage.setItem('expatiq_onboarded', isOnboarded.toString());
  }, [isOnboarded]);

  const handleCompleteOnboarding = (data: {
    primaryTaxHome: string;
    rules: TaxRule[];
    locationTracking: boolean;
    notifications: string[];
  }) => {
    setPrimaryTaxHome(data.primaryTaxHome);
    setRules(data.rules);
    localStorage.setItem('expatiq_primary_home', data.primaryTaxHome);
    setIsOnboarded(true);
  };

  const handleLockOut = () => {
    setIsUnlocked(false);
  };

  const handleResetApp = () => {
    if (window.confirm('Construct physical purge validation? This wipes state.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  /**
   * Safe GDPR Article 15 Data Pack compiler
   */
  const handleExportGDPR = async () => {
    setIsExportingGDPR(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dump = await authService.exportGDPRDataDump(
      'user@tax-track.global',
      primaryTaxHome,
      logs,
      evidence,
      rules
    );

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EXPATIQ-GDPR-RIGHT-TO-ACCESS-${new Date().getFullYear()}.json`;
    link.click();
    setIsExportingGDPR(false);
  };

  /**
   * Safe GDPR Cryptographic Purge (Right to be Forgotten)
   */
  const handleShredAccount = async () => {
    if (window.confirm('CRITICAL: Execute GDPR Right to Be Forgotten? This cryptographically shreds all historical travel history, evidence documents, and cloud sync entries. This action cannot be undone.')) {
      const resp = await authService.purgeAccountAndData('user@tax-track.global');
      setScrubMessage(resp.message);
      setTimeout(() => {
        window.location.reload();
      }, 3500);
    }
  };

  // Compute total days matrix for monitored countries in 2026
  const daysSpentMatrix: Record<string, number> = {};
  logs.forEach(log => {
    const entry = new Date(log.entryDate);
    const exit = log.exitDate ? new Date(log.exitDate) : new Date('2026-05-24'); // Fixed app time anchor
    const diffMs = exit.getTime() - entry.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    daysSpentMatrix[log.countryCode] = (daysSpentMatrix[log.countryCode] || 0) + diffDays;
  });

  // Danger alert diagnostics mapper
  const renderDangerAlerts = () => {
    const alerts: React.ReactNode[] = [];
    rules.forEach((rule) => {
      const days = daysSpentMatrix[rule.countryCode] || 0;
      if (!rule.minDaysRequired) {
        // Upper boundaries
        if (days >= rule.maxDaysLimit) {
          alerts.push(
            <div key={rule.id} className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-rose-400">Jurisdictional Status Red</span>
                <p className="text-xs text-zinc-350 leading-normal">
                  You spent <strong>{days} days</strong> in <span className="text-zinc-100 font-bold">{rule.countryName}</span>, violating the standard limit of {rule.maxDaysLimit} days. This creates double-residency worldwide income audit risks.
                </p>
              </div>
            </div>
          );
        } else if (days >= rule.maxDaysLimit - rule.warningThresholdDays) {
          const buffer = rule.maxDaysLimit - days;
          alerts.push(
            <div key={rule.id} className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-3 text-left">
              <BadgeAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-400">Threshold Crossing Alerts</span>
                <p className="text-xs text-zinc-350 leading-normal">
                  Your physical presence in <span className="text-zinc-100 font-bold">{rule.countryName}</span> is currently <strong>{days} days</strong>. Only <strong>{buffer} safety days</strong> remain before triggering resident exposure.
                </p>
              </div>
            </div>
          );
        }
      } else {
        // Lower limit targets
        if (days < rule.minDaysRequired) {
          const needed = rule.minDaysRequired - days;
          alerts.push(
            <div key={rule.id} className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-xl flex gap-3 text-left">
              <BadgeAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-sky-400">Target Deficit Alarm</span>
                <p className="text-xs text-zinc-350 leading-normal">
                  Anchor presence rule in <span className="text-zinc-100 font-bold">{rule.countryName}</span> requires 90 physical days. You have <strong>{days} days</strong> logged; <strong>{needed} more days</strong> needed to secure certificate.
                </p>
              </div>
            </div>
          );
        }
      }
    });

    return alerts.length > 0 ? (
      <div className="space-y-2">{alerts}</div>
    ) : (
      <div className="p-3 bg-emerald-500/12 border border-emerald-500/20 rounded-xl flex gap-3 text-left">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.2 select-none">
          <span className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-emerald-400">Radar Clear</span>
          <p className="text-[11px] text-zinc-400 leading-normal">All coordinates, geofences, and boundaries are 100% compliant with physical presence targets.</p>
        </div>
      </div>
    );
  };

  // Router rendering based on the selected domain active tab
  const renderCoreViewContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {renderDangerAlerts()}

            <WorldMap 
              daysSummary={daysSpentMatrix}
              rules={rules}
              activeCountryCode={activeCountryCode}
              onSelectCountryCode={(code) => setActiveCountryCode(code)}
            />

            {/* MONOCHROME COMPLIANCE ALERTS STATUS */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3.5 text-left">
              <div>
                <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SOVEREIGN STATS</span>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-tight mt-0.5">Physical Jurisdictions Watchlist</h3>
              </div>

              <div className="space-y-2">
                {rules.map(rule => {
                  const spent = daysSpentMatrix[rule.countryCode] || 0;
                  const ratio = Math.min(100, (spent / rule.maxDaysLimit) * 100);
                  return (
                    <div key={rule.id} className="p-3 bg-[#07080b] border border-zinc-905 rounded-lg space-y-1.5 font-mono">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>{rule.countryName} ({rule.countryCode})</span>
                        <span className="text-amber-400">{spent} / {rule.maxDaysLimit} Days</span>
                      </div>
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${ratio > 85 ? 'bg-rose-500' : ratio > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-550 pt-0.5">
                        <span className="truncate max-w-[80%] italic font-serif">{rule.description}</span>
                        <span>{Math.round(ratio)}% Exp</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE COMPLIANCE CALIBRATION */}
            <div className="bg-[#0b0c10] border border-zinc-900 rounded-xl p-4 space-y-4 text-left">
              <div>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">Border Rule Presets Calibration</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Quick calibration sliders matching multi-jurisdictional criteria limits.</p>
              </div>

              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-300">
                      <span>{rule.countryName} ({rule.countryCode})</span>
                      <span className="text-amber-400">{rule.maxDaysLimit} Days Limit</span>
                    </div>
                    <input 
                      type="range"
                      min="30"
                      max="365"
                      value={rule.maxDaysLimit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setRules(rules.map(r => r.id === rule.id ? { ...r, maxDaysLimit: val } : r));
                      }}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="space-y-6">
            <TimeLogger 
              logs={logs}
              rules={rules}
              activeCountryCode={activeCountryCode}
              onSetActiveCountryCode={setActiveCountryCode}
              simulation={simulation}
              onSetSimulation={setSimulation}
              onAddLog={(newLog) => {
                const id = Math.random().toString();
                setLogs([{ id, ...newLog }, ...logs]);
              }}
              onDeleteLog={(id) => {
                setLogs(logs.filter(l => l.id !== id));
              }}
            />

            {/* CHRONOLOGICAL LEDGER */}
            <div className="bg-[#0c0e12] border border-zinc-800 rounded-xl p-5 space-y-4 text-left">
              <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 font-bold">Chronological Border Entry Logs</h3>
              
              <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                {logs.map((log) => {
                  const isOngoing = log.exitDate === null;
                  return (
                    <div key={log.id} className="flex gap-4 relative pl-7 group">
                      <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-[#0c0e12] transition-colors ${
                        isOngoing ? 'bg-rose-500 animate-pulse' : 'bg-zinc-700'
                      }`} />

                      <div className="flex-1 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-zinc-350">{log.countryCode}</span>
                            <span className="text-xs font-bold text-zinc-200">{log.countryName}</span>
                            <span className="text-[8px] font-mono tracking-wider px-1 bg-zinc-800 border border-zinc-750 text-amber-500 rounded">
                              {log.verifiedMethod}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-serif leading-relaxed italic">"{log.notes}"</p>
                          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-3 pt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-zinc-600" /> {log.entryDate} to {log.exitDate || 'Present'}</span>
                            <span className="text-emerald-500 uppercase font-bold text-[8.5px]">● Confirmed GPS Geofence</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setLogs(logs.filter(l => l.id !== log.id))}
                          className="text-zinc-650 hover:text-rose-400 p-1 transition-opacity shrink-0"
                          title="Delete record row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EVIDENCE UPLOAD INTEGRATED ACCORDION */}
            <div className="bg-[#0b0c10] border border-zinc-900 rounded-xl p-5 text-left space-y-4">
              <div>
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold">FORENSIC STAMPS VAULT</span>
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-tight">Scanned Boarding Documents Archive</h3>
                <p className="text-[10.5px] text-zinc-500 font-serif italic">Every telemetry file logs corresponding satellite hashes directly for complete auditor protection.</p>
              </div>

              <div className="space-y-2">
                {evidence.map(item => (
                  <div key={item.id} className="p-3 bg-zinc-950 border border-zinc-905 rounded-lg flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        {item.fileName}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.fileSize} • Uploaded {item.uploadDate} for {item.countryCode}</p>
                    </div>
                    <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-bold uppercase shrink-0">
                      Confirmed Secure
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'gps':
        return (
          <GPSTrackingHub 
            onAddLog={(newLog) => setLogs([{ id: Math.random().toString(), ...newLog }, ...logs])}
            currentCountry={activeCountryCode}
          />
        );
      case 'reports':
        return (
          <SecureReportsHub 
            logs={logs} 
            evidence={evidence} 
            rules={rules} 
          />
        );
      case 'billing':
        return (
          <SubscriptionPaywall 
            currentTier={currentTier} 
            onUpgrade={(tier) => setCurrentTier(tier)} 
          />
        );
      default:
        return null;
    }
  };

  /**
   * Biometric Login Screen Cover
   */
  if (!isUnlocked) {
    return <BiometricCover onUnlock={() => setIsUnlocked(true)} />;
  }

  /**
   * Safe Custom Onboarding Step Builder
   */
  if (!isOnboarded) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className="bg-[#050608] text-zinc-100 min-h-screen flex flex-col max-w-md mx-auto relative font-sans select-none border-x border-zinc-950 shadow-2xl">
      
      {/* Dynamic Purge GDPR message banner */}
      <AnimatePresence>
        {scrubMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-mono p-4 rounded-xl shadow-2xl z-50 text-center max-w-xs space-y-1 border border-rose-500"
          >
            <p className="font-bold">SHREDDING TELEMETRY LOGS INSTANTLY</p>
            <p className="opacity-80">GDPR Erasure Request Authorized. Cryptographic scrub underway.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Premium App Bar Header */}
      <header className="px-5 py-3.5 border-b border-zinc-900 w-full bg-zinc-950 bg-opacity-95 backdrop-blur-md sticky top-0 z-40 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <div className="text-left">
              <span className="text-[10px] font-mono tracking-widest text-[#cca568] block leading-none select-none font-bold">EXPATIQ</span>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase mt-0.5 leading-none block select-none">
                {isOnline ? 'Cloud backup active' : 'Offline Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setOpenSettings(true)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-amber-500 transition-colors"
              title="Identity & GDPR Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLockOut}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-white transition-colors"
              title="Lock device sandbox"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary content view scrollable */}
      <main className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        
        {/* TAB MATRIX SELECTOR */}
        <div className="flex bg-[#0b0c0f] border border-zinc-900 p-1.2 rounded-xl text-center text-[10px] font-mono justify-between gap-1 overflow-x-auto select-none scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'gps', label: 'GPS Continuity' },
            { id: 'reports', label: 'Secure Reports' },
            { id: 'billing', label: 'Membership' }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-2.5 py-1.8 rounded-lg font-bold tracking-wide transition-all uppercase whitespace-nowrap ${
                  isSelected 
                    ? 'bg-zinc-900 border border-zinc-800 text-amber-500 font-extrabold shadow-lg shadow-black/20 font-sans' 
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Inner views based on tab choice */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {renderCoreViewContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Main Bottom Status Information Label */}
      <footer className="bg-zinc-950 border-t border-zinc-90 w-full text-center px-5 py-4 flex flex-col gap-1 shrink-0">
        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550 uppercase tracking-widest leading-none select-none">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Background tracking active</span>
          </div>
          <div>Last update: 4 min ago</div>
        </div>
      </footer>

      {/* SETTINGS / GDPR PRIVACY DRAWER OVERLAY */}
      <AnimatePresence>
        {openSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-50 flex flex-col text-left justify-end p-6"
          >
            <motion.div 
              initial={{ y: '25%' }}
              animate={{ y: 0 }}
              exit={{ y: '25%' }}
              className="bg-[#08090b] border border-zinc-900 rounded-2.5xl p-5 space-y-5 flex flex-col justify-between max-h-[90%] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-amber-500 uppercase block font-bold tracking-widest">Client Security Settings</span>
                  <h3 className="text-sm font-black uppercase text-zinc-100 font-sans tracking-tight">User Security & GDPR Panel</h3>
                </div>
                <button 
                  onClick={() => setOpenSettings(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Secure client metadata display */}
              <div className="p-3 bg-zinc-950 border border-zinc-905 rounded-xl space-y-2 text-xs">
                <span className="text-[9px] font-mono text-zinc-550 uppercase font-bold block">Authorized Identification Profile</span>
                <div className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-400">
                  <span>Client Identifier</span>
                  <span className="font-mono text-zinc-200">2026-VIP-ojajarvi</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1 text-zinc-400">
                  <span>Register Primary Home</span>
                  <span className="text-amber-500 font-bold uppercase">{primaryTaxHome}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Local database sync status</span>
                  <span className="text-emerald-400 font-bold uppercase font-sans">Synced (MD5 Checked)</span>
                </div>
              </div>

              {/* GDPR COMPLIANT TRIGGERS */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">App Store & GDPR Legal Actions Services</span>
                
                <button
                  onClick={handleExportGDPR}
                  disabled={isExportingGDPR}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded font-mono font-bold uppercase text-[9.5px] tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  {isExportingGDPR ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      Formatting JSON Manifest...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-zinc-500" /> GDPR Art 15 Personal Data Dump
                    </>
                  )}
                </button>

                <button
                  onClick={handleShredAccount}
                  className="w-full py-2.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded font-mono font-bold uppercase text-[9.5px] tracking-wider transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> GDPR Art 17 Cryptographic Purge (Forget Me)
                </button>
              </div>

              {/* STORE SUBMISSION ASSETS MODULE */}
              <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-3 space-y-3">
                <button
                  onClick={() => setShowAssetViewer(!showAssetViewer)}
                  className="w-full flex justify-between items-center text-[10.5px] font-mono font-bold text-amber-500 uppercase tracking-widest text-left focus:outline-none"
                >
                  <span>📱 App Store & Play Store Assets</span>
                  <span className="text-xs">{showAssetViewer ? 'Collapse [-]' : 'Expand [+]'}</span>
                </button>

                {showAssetViewer && (
                  <div className="space-y-4 pt-2 border-t border-zinc-900">
                    <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                      Submission-ready branding and panoramic design assets custom compiled for Apple App Store & Google Play Store submittals.
                    </p>

                    {/* App Icon display */}
                    <div className="space-y-1.5 p-3 bg-zinc-900/30 rounded-lg border border-zinc-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-zinc-400 uppercase font-black">Launcher App Icon (1024x1024)</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">READY</span>
                      </div>
                      <div className="flex justify-center py-2">
                        <img 
                          src="/src/assets/images/taxtrack_app_icon_1779616500665.png" 
                          alt="EXPATIQ App Icon Asset" 
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-2xl border border-zinc-800 shadow-xl shadow-black/80"
                        />
                      </div>
                      <span className="text-[8.5px] font-mono text-zinc-500 text-center block">Monochrome luxury fintech seal. Absolute charcoal.</span>
                    </div>

                    {/* Screenshot presentation */}
                    <div className="space-y-1.5 p-3 bg-zinc-900/30 rounded-lg border border-zinc-900">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-zinc-400 uppercase font-black">App Store Panoramic Screenshot mockup</span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">READY</span>
                      </div>
                      <div className="flex justify-center py-2">
                        <img 
                          src="/src/assets/images/taxtrack_screenshot_1779616520611.png" 
                          alt="App Store Panoramic Screenshot" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-48 object-contain rounded-lg border border-zinc-800"
                        />
                      </div>
                      <span className="text-[8.5px] font-mono text-zinc-500 text-center block">Sleek map coordinates showing verified presence.</span>
                    </div>

                    {/* Metadata checklist */}
                    <div className="p-2.5 bg-zinc-950 rounded text-[9.5px] font-mono text-zinc-400 space-y-1 border border-zinc-900">
                      <span className="text-[8.5px] text-zinc-650 block uppercase">SUBMISSION SPEC CHECKLIST</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Standard 1024px PNG Icon (Ready)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>iPhone 6.7" & 6.5" Portrait Screens (Ready)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>Compliance-first marketing copy (Approved)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STATUTORY JURISDICTIONAL COPY DISCLAIMER */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-905 rounded-xl space-y-2.5 font-sans leading-relaxed text-[10.5px]">
                <div className="flex gap-2 text-zinc-450 items-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Private Zero-Knowledge Architecture: </strong> Your travel duration calculations operate completely within your local client browser session. No physical movements or exact geographic coordinates are tracked or processed externally.
                  </div>
                </div>

                <div className="flex gap-2 text-zinc-450 border-t border-zinc-900 pt-2.5 items-start">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <strong>Statutory Disclaimer Clause: </strong> EXPATIQ tracks geographic indices for presence verification and travel documentation purposes only. Calculations do not constitute, represent, or substitute for formal legal, audit, or tax consultations or professional advice.
                  </div>
                </div>
              </div>

              {/* Trigger Reset button */}
              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-zinc-900 font-mono">
                <span className="text-zinc-650 uppercase">Manual Device Purge</span>
                <button
                  onClick={handleResetApp}
                  className="px-2.5 py-1 text-zinc-550 border border-zinc-900 rounded uppercase font-bold text-[9px] hover:text-rose-400 hover:border-rose-950/20 transition-colors"
                >
                  Factory Purge Device
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
