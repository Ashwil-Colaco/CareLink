import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Upload, 
  Globe, 
  MapPin, 
  FileText, 
  Terminal, 
  Activity, 
  Zap, 
  Plus, 
  Trash2, 
  Database,
  Search,
  CheckCircle2,
  AlertCircle,
  Radio,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from "@/lib/utils";

interface IngestionCenterProps {
  onDataSubmit: (data: string) => void;
  onGlobalScan: (isBackground?: boolean, region?: string, keywords?: string[]) => void;
  isAnalyzing: boolean;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onLoadPresets: (type: 'crisis' | 'logistics' | 'refugee') => void;
}

export function IngestionCenter({ 
  onDataSubmit, 
  onGlobalScan, 
  isAnalyzing, 
  isMonitoring, 
  onToggleMonitoring,
  isStreaming,
  onToggleStreaming,
  onLoadPresets
}: IngestionCenterProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [fieldReport, setFieldReport] = useState({
    location: '',
    category: 'General',
    priority: 'Medium',
    description: '',
    peopleAffected: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [scanRegion, setScanRegion] = useState("");
  const [scanKeywords, setScanKeywords] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = `
FIELD REPORT SUMMARY
--------------------
LOCATION: ${fieldReport.location}
CATEGORY: ${fieldReport.category}
PRIORITY: ${fieldReport.priority}
POPULATION AFFECTED: ${fieldReport.peopleAffected}
STATED NEED: ${fieldReport.description}
    `;
    onDataSubmit(formattedData.trim());
    setFieldReport({ location: '', category: 'General', priority: 'Medium', description: '', peopleAffected: '' });
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onDataSubmit(event.target?.result as string);
      };
      reader.readAsText(files[0]);
    }
  }, [onDataSubmit]);

  const presets = [
    { id: 'crisis' as const, label: 'Medical Shortage', icon: Activity, color: 'text-red-500' },
    { id: 'logistics' as const, label: 'Flood Logistics', icon: Database, color: 'text-blue-500' },
    { id: 'refugee' as const, label: 'Refugee Camps', icon: Globe, color: 'text-emerald-500' }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="border-foreground/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-foreground/5 bg-foreground/[0.01]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Intelligence Ingestion Bridge</CardTitle>
                  <CardDescription className="text-[11px] font-serif italic opacity-60 mt-1">Connect field reports, regional databases, or live surveillance feeds.</CardDescription>
                </div>
                <TabsList className="bg-foreground/5 p-1 h-9 rounded-xl">
                  <TabsTrigger value="upload" className="text-[9px] uppercase tracking-widest px-4 rounded-lg">Upload</TabsTrigger>
                  <TabsTrigger value="field" className="text-[9px] uppercase tracking-widest px-4 rounded-lg">Reporter</TabsTrigger>
                  <TabsTrigger value="web" className="text-[9px] uppercase tracking-widest px-4 rounded-lg">Surveillance</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                <TabsContent value="upload" className="m-0 outline-none">
                  <motion.div
                    key="tab-upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative aspect-[16/5] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-foreground/10 hover:border-primary/40 hover:bg-foreground/[0.02]'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => onDataSubmit(ev.target?.result as string);
                          reader.readAsText(file);
                        }
                      }} />
                      <div className="p-4 rounded-full bg-foreground/5 group-hover:scale-110 transition-transform mb-4">
                        <Upload className="h-6 w-6 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 group-hover:opacity-80 transition-opacity">Upload scattered paper surveys & scanned field reports</p>
                      <p className="text-[9px] opacity-20 uppercase tracking-widest mt-2 font-mono">SUPPORTED: .CSV / .JSON / .JPG / .PNG / .TXT</p>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="field" className="m-0 outline-none">
                  <motion.form
                    key="tab-field"
                    onSubmit={handleFieldSubmit}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold ml-1">Report Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 opacity-30" />
                          <input 
                            placeholder="Lat/Long or Region Name" 
                            className="w-full pl-10 h-10 rounded-xl bg-foreground/5 border-none text-xs focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            value={fieldReport.location}
                            onChange={e => setFieldReport(prev => ({ ...prev, location: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold ml-1">Urgency</label>
                          <select 
                            className="w-full h-10 rounded-xl bg-foreground/5 border-none text-xs px-3 focus:ring-0"
                            value={fieldReport.priority}
                            onChange={e => setFieldReport(prev => ({ ...prev, priority: e.target.value }))}
                          >
                            <option>Critical</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold ml-1">Category</label>
                          <select 
                            className="w-full h-10 rounded-xl bg-foreground/5 border-none text-xs px-3 focus:ring-0"
                            value={fieldReport.category}
                            onChange={e => setFieldReport(prev => ({ ...prev, category: e.target.value }))}
                          >
                            <option>Medical</option>
                            <option>Water/Sanitation</option>
                            <option>Food/Shelter</option>
                            <option>Logistics</option>
                            <option>Protection</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest opacity-40 font-bold ml-1">Field Observations</label>
                        <textarea 
                          placeholder="Describe the detected gap or urgent requirement..."
                          className="w-full h-[106px] rounded-xl bg-foreground/5 border-none text-xs p-3 resize-none focus:ring-0 placeholder:opacity-40"
                          value={fieldReport.description}
                          onChange={e => setFieldReport(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!fieldReport.location || !fieldReport.description}
                        className="w-full h-10 rounded-xl bg-primary text-black font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                      >
                        Launch Field Synthesis
                        <Zap className="ml-2 h-3.5 w-3.5 fill-black" />
                      </Button>
                    </div>
                  </motion.form>
                </TabsContent>

                <TabsContent value="web" className="m-0 outline-none">
                  <motion.div
                    key="tab-web"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="p-8 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center space-y-6 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                         <motion.div 
                           className="h-full bg-primary"
                           initial={{ width: 0 }}
                           animate={{ width: isAnalyzing ? '100%' : '0%' }}
                           transition={{ duration: 2, repeat: Infinity }}
                         />
                      </div>
                      
                      <div className="p-5 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                        <Globe className={`h-10 w-10 text-primary ${isAnalyzing ? 'animate-spin' : ''}`} />
                      </div>
                      
                      <div className="space-y-2 max-w-sm">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Automated Intelligence Recon</h3>
                        <p className="text-[11px] font-serif italic opacity-60">The CareLink AI will autonomously scan global news feeds, NGO databases (ReliefWeb, OCHA), and regional intelligence sources to detect emerging crises.</p>
                      </div>

                      <div className="space-y-4 w-full max-w-sm">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 opacity-40" />
                          <input 
                            placeholder="Target Region (e.g. Asia, Sub-Saharan Africa)" 
                            className="w-full text-xs h-10 pl-10 rounded-xl bg-foreground/5 border-none focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            value={scanRegion}
                            onChange={(e) => setScanRegion(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 opacity-40" />
                          <input 
                            placeholder="Keywords (e.g. flood, vaccines, water shortage)" 
                            className="w-full text-xs h-10 pl-10 rounded-xl bg-foreground/5 border-none focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                            value={scanKeywords}
                            onChange={(e) => setScanKeywords(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={() => {
                          const keywords = scanKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
                          onGlobalScan(false, scanRegion, keywords);
                        }}
                        disabled={isAnalyzing}
                        className="h-14 px-12 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 transition-all text-sm group"
                      >
                        {isAnalyzing ? "Scanning Area..." : "Initiate Targeted Scan"}
                        <Zap className="ml-3 h-5 w-5 fill-black group-hover:animate-pulse" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                       <div className={`p-4 rounded-2xl border transition-all ${isMonitoring ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,64,64,0.1)]' : 'bg-foreground/5 border-transparent opacity-60'}`}>
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Activity className={`h-3 w-3 ${isMonitoring ? 'text-red-500' : 'text-gray-400'}`} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Urgency Surveillance</span>
                             </div>
                             <Badge variant={isMonitoring ? 'default' : 'secondary'} className="text-[8px] px-2 py-0">
                               {isMonitoring ? 'LIVE' : 'IDLE'}
                             </Badge>
                           </div>
                           <p className="text-[10px] opacity-40 leading-relaxed mb-4">Continuous extraction of critical threats and resource gaps from global humanitarian sources.</p>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={onToggleMonitoring}
                             disabled={isAnalyzing}
                             className={`w-full h-9 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                               isMonitoring ? 'border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' : 'border-foreground/10'
                             }`}
                           >
                             {isAnalyzing && isMonitoring ? (
                               <span className="flex items-center gap-2">
                                 <Loader2 className="h-3 w-3 animate-spin" />
                                 Scanning...
                               </span>
                             ) : isMonitoring ? 'Disable Monitor' : 'Enable Surveillance'}
                           </Button>
                       </div>

                       <div className={`p-4 rounded-2xl border transition-all ${isStreaming ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-foreground/5 border-transparent opacity-60'}`}>
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <Radio className={`h-3 w-3 ${isStreaming ? 'text-blue-500' : 'text-gray-400'}`} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Neural Stream</span>
                             </div>
                             <Badge variant={isStreaming ? 'default' : 'secondary'} className="text-[8px] px-2 py-0">
                               {isStreaming ? 'INGESTING' : 'OFFLINE'}
                             </Badge>
                           </div>
                           <p className="text-[10px] opacity-40 leading-relaxed mb-4">Direct telemetry ingestion from community field sensors and real-time humanitarian data streams.</p>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={onToggleStreaming}
                             className={`w-full h-9 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                               isStreaming ? 'border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white' : 'border-foreground/10'
                             }`}
                           >
                             {isStreaming ? (
                               <span className="flex items-center gap-2">
                                 <Activity className="h-3 w-3 animate-pulse text-blue-500" />
                                 Sever Stream
                               </span>
                             ) : 'Establish Link'}
                           </Button>
                       </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-foreground/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl h-full shadow-2xl">
          <CardHeader className="bg-foreground/[0.01] border-b border-foreground/5">
            <CardTitle className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Impact Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onLoadPresets(preset.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-foreground/5 bg-foreground/[0.01] hover:bg-foreground/[0.05] hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors`}>
                      <preset.icon className={`h-4 w-4 ${preset.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100">{preset.label}</span>
                  </div>
                  <Plus className="h-3.5 w-3.5 opacity-20 group-hover:opacity-100 group-hover:text-primary" />
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-foreground/5 border border-dashed border-foreground/10">
               <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
                  <Database className="h-3.5 w-3.5" />
                  Synthesis Health
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Signal Strength</span>
                    <span className="text-[9px] font-mono font-black text-emerald-500">OPTIMAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Buffer Depth</span>
                    <span className="text-[9px] font-mono opacity-50">12,000 chars</span>
                  </div>
                  <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary" 
                      initial={{ width: 0 }} 
                      animate={{ width: '85%' }} 
                      transition={{ duration: 1.5, ease: 'easeOut' }} 
                    />
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
