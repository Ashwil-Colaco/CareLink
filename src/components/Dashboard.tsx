import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { analyzeData, analyzeWebsite, discoverRegionalIssues, directGlobalScanAndAnalyze } from "../services/geminiService";
import { AnalysisReport } from "../types";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { ReportView } from "./ReportView";
import { DataVisualizer } from "./DataVisualizer";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { SynthesisHub } from "./SynthesisHub";
import { ExportCenter } from "./ExportCenter";
import { VolunteerMatcher } from "./VolunteerMatcher";
import { ChatBot } from "./ChatBot";
import { ReportHistory } from "./ReportHistory";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { IngestionCenter } from "./IngestionCenter";
import { GlobeDistress } from "./GlobeDistress";
import { CareLinkLogo } from "./CareLinkLogo";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle2, Database, Download, FileText, Globe, History, Loader2, Play, Radio, ShieldCheck, Terminal, Upload, Zap, HandHelping, Boxes, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { io } from "socket.io-client";
import { persistenceService, StoredReport, MonitoredTarget } from "../services/persistenceService";

// Isolated Log Component to prevent full Dashboard re-renders
const ImpactLogs = memo(({ isAnalyzing, report, isMonitoring, isStreaming, lastScanTime }: {
  isAnalyzing: boolean;
  report: AnalysisReport | null;
  isMonitoring: boolean;
  isStreaming: boolean;
  lastScanTime: Date | null;
}) => {
  return (
    <Card className="border-foreground/5 bg-black text-[#E4E3E0] shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] py-3">
        <CardTitle className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] opacity-40 font-bold">
          <Terminal className="h-3 w-3" />
          CareLink System Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[120px] font-mono text-[10px] p-4 opacity-60">
          <div className="space-y-1.5">
            <div className="flex gap-3">
              <span className="opacity-30">[00:00:01]</span>
              <span>CareLink intelligence hub online...</span>
            </div>
            {isAnalyzing && (
              <div className="flex gap-3 text-primary animate-pulse">
                <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span>Urgency detection engine actively scanning datasets...</span>
              </div>
            )}
            {isStreaming && (
              <div className="flex gap-3 text-neon-cyan animate-pulse">
                <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span>Field data stream ingestion established. Ingesting community reports.</span>
              </div>
            )}
            {report && (
              <div className="flex gap-3 text-neon-cyan/80">
                <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span>Impact matrix synchronized. Priorities flagged.</span>
              </div>
            )}
            {isMonitoring && (
              <div className="flex gap-3 text-red-500 animate-pulse">
                <span className="opacity-30">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span>Urgent need surveillance active...</span>
              </div>
            )}
            {lastScanTime && (
              <div className="flex gap-3 text-neon-cyan">
                <span className="opacity-30">[{lastScanTime.toLocaleTimeString('en-US', { hour12: false })}]</span>
                <span>Regional scan refresh successful.</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

ImpactLogs.displayName = "ImpactLogs";

// Optimized Header Component
const DashboardHeader = memo(({ user, logout, isPhoneMode, onTogglePhoneMode }: {
  user: any;
  logout: () => void;
  isPhoneMode: boolean;
  onTogglePhoneMode: () => void;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b border-foreground/5 bg-background/60 backdrop-blur-xl ${isPhoneMode ? 'py-1' : 'py-4'}`}>
      <div className={`mx-auto flex items-center justify-between ${isPhoneMode ? 'px-4 max-w-full' : 'max-w-5xl px-6'}`}>
        <div className="flex items-center gap-3">
          <CareLinkLogo size={isPhoneMode ? 32 : 40} />
          <div className="flex flex-col">
            <h1 className={`${isPhoneMode ? 'text-lg' : 'text-xl'} font-bold tracking-tighter uppercase leading-none`}>
              Care<span className="text-primary font-black">Link</span>
            </h1>
            {!isPhoneMode && <p className="text-[9px] font-mono opacity-40 uppercase tracking-[0.3em] mt-1.5 italic">Humanitarian Intelligence Hub v2.1.0</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isPhoneMode && user && (
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/5">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-tight">{user?.displayName}</p>
                <p className="text-[8px] opacity-40 uppercase tracking-widest">{user?.email}</p>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-7 w-7 rounded-full border border-foreground/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePhoneMode}
              className={`h-9 w-9 p-0 rounded-lg transition-colors ${isPhoneMode ? 'bg-primary/20 text-primary' : 'opacity-40 hover:opacity-100'}`}
              title="Toggle Regional Optimization"
            >
              <Globe className={`h-4 w-4 ${isPhoneMode ? 'rotate-12' : ''}`} />
            </Button>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              Logout
            </Button>
          </div>
          {!isPhoneMode && (
             <div className="hidden sm:flex flex-col gap-1 pl-4 border-l border-foreground/10 justify-center min-w-[130px]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Secure</span>
              </div>
              <div className="font-mono text-[8.5px] font-bold text-foreground/50 uppercase tracking-[0.2em] whitespace-nowrap">
                {`${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')} ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}:${String(currentTime.getSeconds()).padStart(2, '0')} LOC`}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = "DashboardHeader";

// Optimized Tab Selection Component
const IntelligenceTabs = memo(({ 
  isPhoneMode, 
  activeTab, 
  onTabChange, 
  report, 
  archivedReports, 
  rawData, 
  onSelectArchived, 
  isAnalyzing, 
  exportReport,
  selectedForSynthesis,
  onClearSynthesis,
  liveStreamData
}: {
  isPhoneMode: boolean;
  activeTab: string;
  onTabChange: (v: string) => void;
  report: AnalysisReport | null;
  archivedReports: StoredReport[];
  rawData: string;
  onSelectArchived: (s: StoredReport) => void;
  isAnalyzing: boolean;
  exportReport: () => void;
  selectedForSynthesis: StoredReport[];
  onClearSynthesis: () => void;
  liveStreamData: any[];
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full flex flex-col items-center">
      <div className={`flex flex-col items-center w-full ${isPhoneMode ? 'gap-6 mb-8' : 'gap-8 mb-12'}`}>
        <TabsList className={`grid w-full bg-foreground/5 p-1 rounded-2xl ${isPhoneMode ? 'grid-cols-4 grid-rows-2 h-auto max-w-full' : 'max-w-6xl grid-cols-7'}`}>
          <TabsTrigger value="report" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Impact
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            History
          </TabsTrigger>
          <TabsTrigger value="visuals" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Trends
          </TabsTrigger>
          <TabsTrigger value="simulator" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Outlook
          </TabsTrigger>
          <TabsTrigger value="volunteers" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Volunteers
          </TabsTrigger>
          <TabsTrigger value="synthesis" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Collab Hub
          </TabsTrigger>
          <TabsTrigger value="export" className="text-[9px] py-2.5 uppercase tracking-widest rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md">
            Export
          </TabsTrigger>
        </TabsList>
        
        {!isPhoneMode && report && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={exportReport}
            className="text-[9px] uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
          >
            <Download className="mr-2 h-3 w-3" />
            Raw JSON Export Protocol
          </Button>
        )}
      </div>

      <div className="w-full">
        <TabsContent value="report" className="mt-0 outline-none w-full">
          {activeTab === "report" && (
            report ? <ReportView report={report} /> : (
              <div className="py-20 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">Awaiting Impact Intelligence...</div>
            )
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-0 outline-none w-full">
          {activeTab === "history" && (
            <ReportHistory 
              reports={archivedReports} 
              onSelect={onSelectArchived} 
              selectedIds={selectedForSynthesis.map(r => r.id || '')}
              onSelectMultiple={(reps) => {}} // Handle clicking in dashboard
            />
          )}
        </TabsContent>
        <TabsContent value="visuals" className="mt-0 outline-none w-full">
          {activeTab === "visuals" && <DataVisualizer report={report} rawData={rawData} liveStream={liveStreamData} />}
        </TabsContent>
        <TabsContent value="simulator" className="mt-0 outline-none w-full">
          {activeTab === "simulator" && report ? <ScenarioSimulator report={report} /> : (
            <div className="py-20 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">Analyze field data to enable outlook simulation</div>
          )}
        </TabsContent>
        <TabsContent value="volunteers" className="mt-0 outline-none w-full">
          {activeTab === "volunteers" && report ? <VolunteerMatcher report={report} /> : (
            <div className="py-20 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">Analyze field data to enable volunteer matching</div>
          )}
        </TabsContent>
        <TabsContent value="synthesis" className="mt-0 outline-none w-full">
          {activeTab === "synthesis" && (
            <SynthesisHub selectedReports={selectedForSynthesis} onClear={onClearSynthesis} />
          )}
        </TabsContent>
        <TabsContent value="export" className="mt-0 outline-none w-full">
          {activeTab === "export" && report ? <ExportCenter report={report} /> : (
            <div className="py-20 text-center opacity-20 text-[10px] uppercase tracking-[0.3em]">Analyze data to enable export</div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
});

IntelligenceTabs.displayName = "IntelligenceTabs";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [rawData, setRawData] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("report");
  const [notification, setNotification] = useState<string | null>(null);
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [selectedForSynthesis, setSelectedForSynthesis] = useState<StoredReport[]>([]);
  const [liveStreamData, setLiveStreamData] = useState<any[]>([]);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  
  // Persistence State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [archivedReports, setArchivedReports] = useState<StoredReport[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load archived reports
  useEffect(() => {
    if (user) {
      return persistenceService.subscribeToReports(setArchivedReports);
    }
  }, [user]);

  // Load monitoring status
  useEffect(() => {
    if (user) {
      return persistenceService.subscribeToMonitoring((targets) => {
        // Find global surveillance target if it exists
        const globalTarget = targets.find(t => t.url === 'GLOBAL_SURVEILLANCE');
        if (globalTarget) {
          setIsMonitoring(globalTarget.isActive);
          if (globalTarget.lastAnalyzed) setLastScanTime(globalTarget.lastAnalyzed.toDate());
        }
      });
    }
  }, [user]);

  // Real-time Socket.io Ingestion
  useEffect(() => {
    let socket: any;
    if (isLiveStreamActive) {
      socket = io();
      socket.on("neural_pulse", (data: any) => {
        setLiveStreamData(prev => {
          const newData = [...prev, data].slice(-20); // Keep last 20 points
          return newData;
        });
      });
      
      setNotification("Field Data Link Established: Region-wide signal tracking active.");
      setTimeout(() => setNotification(null), 3000);
    }
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, [isLiveStreamActive]);

  const toggleLiveStream = useCallback(() => {
    setIsLiveStreamActive(prev => {
      if (!prev) setLiveStreamData([]);
      return !prev;
    });
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawData(content);
      setNotification(`File "${file.name}" attached successfully.`);
      setTimeout(() => setNotification(null), 3000);
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!rawData.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeData(rawData);
      setReport(result);
      setActiveTab("report"); // Switch back to main report view
      if (user) {
        await persistenceService.saveReport(result, 'raw');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impact Intelligence synthesis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [rawData, user]);

  const handleGlobalScan = useCallback(async (isBackground = false, region: string = "Global", keywords: string[] = []) => {
    const finalRegion = region.trim() === "" ? "Global" : region;
    if (!isBackground) setIsAnalyzing(true);
    setError(null);
    if (!isBackground) setNotification(`${finalRegion} AI Reconnaissance active. Identifying regional hotspots...`);
    try {
      const { rawSummary, report: result } = await directGlobalScanAndAnalyze(finalRegion, keywords);
      setRawData(rawSummary);
      setReport(result);
      if (user) {
        await persistenceService.saveReport(result, 'surveillance');
        await persistenceService.updateLastAnalyzed('GLOBAL_SURVEILLANCE');
      }
      setLastScanTime(new Date());
      if (!isBackground) {
        setNotification("Scanning complete. New intelligence detected.");
        setActiveTab("report"); // Switch to report which now includes the globe
      }
    } catch (err: any) {
      console.error(err);
      if (!isBackground) setError(err.message || "Global surveillance failed.");
    } finally {
      if (!isBackground) setIsAnalyzing(false);
      if (!isBackground) setTimeout(() => setNotification(null), 3000);
    }
  }, [user]);

  // Polling for "Continuous Monitoring" in the frontend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        handleGlobalScan(true);
      }, 300000); // Pulse every 5 minutes to stay efficient
    }
    return () => clearInterval(interval);
  }, [isMonitoring, handleGlobalScan]);

  const toggleMonitoring = async () => {
    const newStatus = !isMonitoring;
    try {
      await persistenceService.toggleMonitoring('GLOBAL_SURVEILLANCE', newStatus);
      setIsMonitoring(newStatus);
      if (newStatus) handleGlobalScan(false);
    } catch (err) {
      setError("Failed to update surveillance status.");
    }
  };

  const handleSelectArchived = useCallback((stored: StoredReport) => {
    // If shift key or Selection Mode is active (implied by multi-select in Hub)
    if (activeTab === 'synthesis') {
      setSelectedForSynthesis(prev => {
        const exists = prev.find(p => p.id === stored.id);
        if (exists) return prev.filter(p => p.id !== stored.id);
        const newSelection = [...prev, stored];
        // Hard limit on synthesis to prevent browser strain
        return newSelection.slice(-4);
      });
    } else {
      setReport(stored);
      setActiveTab("report");
    }
  }, [activeTab]);

  const handleFileRequest = useCallback((type: string) => {
    if (!report) return;
    const timestamp = new Date().toLocaleTimeString();
    setNotification(`Generation Protocol Initiated: ${type.toUpperCase()}. Check chat for code.`);
    setTimeout(() => setNotification(null), 5000);
    console.log(`[${timestamp}] Requesting ${type.toUpperCase()} generation protocol...`);
  }, [report]);

  const loadSamplePreset = useCallback((type: 'crisis' | 'logistics' | 'refugee') => {
    let sample = '';
    switch(type) {
      case 'crisis':
        sample = `
REGIONAL MEDICAL SURVEILLANCE DATA - ASIA-SOUTH1
---------------------------------------------
DATE: 2024-03-12T10:00:00Z
LOCATION: Sector 7, North Coastal Region
OBSERVATIONS:
- Critical shortage of type-O negative blood supply.
- Three local clinics reporting 0 units of specialized antibiotics.
- Local volunteer count: 12 (Skills: 4 paramedic, 8 general).
- Predicted need: 50% increase in medical supplies within 48 hours.
- Reported fever cases rising: +22% since previous scan.
- LATITUDE: 13.75, LONGITUDE: 100.52 (Bangkok Centroid)
        `;
        break;
      case 'logistics':
        sample = `
FIELD LOGISTICS AUDIT: FLOOD ZONE A
----------------------------------
DATE: 2024-03-24T06:45:00Z
LOCATION: River Plains Basin
GAPS IDENTIFIED:
- Accessible roads reduced to 2 (from 8) due to rising water levels.
- 4 distribution hubs currently isolated.
- Need: High-clearance vehicles (Current: 2, Required: 12).
- NGOs active: 3 local groups.
- Resource Clash: Fuel reserves dropping at HUB-4.
- LATITUDE: 16.44, LONGITUDE: 102.83 (Khon Kaen High Ground)
        `;
        break;
      case 'refugee':
        sample = `
REFUGEE SETTLEMENT IMPACT DASHBOARD
---------------------------------
LOCATION: Border Zone Camp-Alpha
POPULATION: Est. 45,000 (+1,200/day)
STATED REQUIREMENTS:
- Primary: Potable water (Current deficit: 15,000L).
- Mental health volunteers severely under-resourced.
- Only 3 out of 10 hygiene stations operational.
- Potential Impact: High risk of cholera outbreak if water gap persists.
- Proposed Action: Divert resource-train B from Sector 2.
- LATITUDE: 18.79, LONGITUDE: 98.98 (Chiang Mai Regional Hub)
        `;
        break;
    }
    setRawData(sample.trim());
    setNotification(`NGO Preset Loaded: ${type.toUpperCase()}`);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const exportReport = useCallback(() => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "intelligence_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [report]);

  const togglePhoneMode = useCallback(() => setIsPhoneMode(prev => !prev), []);

  const clearSynthesis = useCallback(() => setSelectedForSynthesis([]), []);

  return (
    <div className={`min-h-screen bg-background technical-grid flex flex-col overflow-x-hidden ${isPhoneMode ? 'px-0' : ''}`}>
      <DashboardHeader 
        user={user} 
        logout={logout} 
        isPhoneMode={isPhoneMode} 
        onTogglePhoneMode={togglePhoneMode} 
      />

      <main className={`flex-1 mx-auto w-full ${isPhoneMode ? 'max-w-full px-4 py-8' : 'max-w-5xl px-6 py-12'}`}>
        <div className={`w-full ${isPhoneMode ? 'space-y-8' : 'space-y-16'}`}>
          {/* Input Section */}
          <section className={`w-full mx-auto ${isPhoneMode ? '' : 'max-w-4xl space-y-8'}`}>
            {!isPhoneMode && (
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-[0.4em] opacity-30">Intelligence Input Protocol</h2>
              </div>
            )}
            
            <IngestionCenter 
              onDataSubmit={(data) => {
                setRawData(data);
                handleAnalyze();
              }}
              onGlobalScan={handleGlobalScan}
              isAnalyzing={isAnalyzing}
              isMonitoring={isMonitoring}
              onToggleMonitoring={toggleMonitoring}
              isStreaming={isLiveStreamActive}
              onToggleStreaming={toggleLiveStream}
              onLoadPresets={loadSamplePreset}
            />

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center text-[10px] font-bold uppercase tracking-widest text-red-500"
              >
                {error}
              </motion.div>
            )}

            {!isPhoneMode && (
              <ImpactLogs 
                isAnalyzing={isAnalyzing} 
                report={report} 
                isMonitoring={isMonitoring} 
                isStreaming={isLiveStreamActive}
                lastScanTime={lastScanTime} 
              />
            )}
          </section>

          {/* Main Content Section */}
          <section className={`w-full ${isPhoneMode ? 'space-y-8' : 'space-y-12'}`}>
            <AnimatePresence>
              {notification && (
                <motion.div
                  key="notification"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`max-w-md mx-auto rounded-full bg-emerald-500/5 border border-emerald-500/10 ${isPhoneMode ? 'px-4 py-1.5' : 'px-6 py-2'} text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-between shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-3 w-3" />
                    {notification}
                  </div>
                  <button onClick={() => setNotification(null)} className="opacity-40 hover:opacity-100 ml-4">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {(report || archivedReports.length > 0) ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={isPhoneMode ? 'space-y-8' : 'space-y-12'}
                >
                  <IntelligenceTabs 
                    isPhoneMode={isPhoneMode}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    report={report}
                    archivedReports={archivedReports}
                    rawData={rawData}
                    onSelectArchived={handleSelectArchived}
                    isAnalyzing={isAnalyzing}
                    exportReport={exportReport}
                    selectedForSynthesis={selectedForSynthesis}
                    onClearSynthesis={clearSynthesis}
                    liveStreamData={liveStreamData}
                  />
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex flex-col items-center justify-center ${isPhoneMode ? 'h-[300px]' : 'h-[500px]'}`}
                >
                  <div className="relative mb-8">
                    <Loader2 className={`${isPhoneMode ? 'h-12 w-12' : 'h-16 w-16'} animate-spin opacity-10`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className={`${isPhoneMode ? 'h-4 w-4' : 'h-6 w-6'} text-primary animate-pulse`} />
                    </div>
                  </div>
                  <h3 className={`${isPhoneMode ? 'text-lg' : 'text-xl'} font-bold opacity-30 uppercase tracking-widest`}>Synthesizing</h3>
                  <p className="animate-pulse font-mono text-[10px] opacity-20 uppercase tracking-[0.5em] mt-4">PROBING...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-foreground/5 bg-foreground/[0.01] ${isPhoneMode ? 'h-[300px]' : 'h-[500px]'}`}
                >
                  <div className={`flex items-center justify-center rounded-full bg-foreground/5 border border-foreground/5 ${isPhoneMode ? 'mb-4 h-14 w-14' : 'mb-6 h-20 w-20'}`}>
                    <FileText className={`opacity-10 ${isPhoneMode ? 'h-6 w-6' : 'h-8 w-8'}`} />
                  </div>
                  <h3 className={`${isPhoneMode ? 'text-lg' : 'text-xl'} font-bold opacity-30 uppercase tracking-widest text-center`}>
                    {isPhoneMode ? "Awaiting Data" : "Awaiting Intelligence Feed"}
                  </h3>
                  {!isPhoneMode && (
                    <p className="max-w-xs text-center text-[11px] opacity-20 uppercase tracking-widest mt-4 leading-relaxed">
                      Input raw data or a target URL to generate a decision-ready intelligence report.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className={`mx-auto w-full border-t border-foreground/5 px-6 ${isPhoneMode ? 'py-10' : 'py-12 max-w-5xl'}`}>
        <div className={`flex flex-col items-center justify-between gap-6 opacity-30 ${isPhoneMode ? '' : 'md:flex-row'}`}>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-center">
            {isPhoneMode ? "CareLink AI" : "Powered by Gemini 3.1 Flash Lite • CareLink Intelligence Systems"} &bull; {new Date().getFullYear()}
          </p>
          <div className={`flex items-center gap-6 text-[9px] uppercase tracking-widest font-bold ${isPhoneMode ? 'flex-wrap justify-center' : ''}`}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
      <ChatBot report={report} />
    </div>
  );
}
