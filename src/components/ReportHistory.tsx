import React, { useState, useMemo, useDeferredValue } from "react";
import { StoredReport } from "../services/persistenceService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Clock, Download, ExternalLink, FileText, Globe } from "lucide-react";
import { motion } from "motion/react";

interface ReportHistoryProps {
  reports: StoredReport[];
  onSelect: (report: StoredReport) => void;
  onSelectMultiple?: (reports: StoredReport[]) => void;
  selectedIds?: string[];
}

const HistoryItem = React.memo(({ 
  report, 
  idx, 
  onSelect, 
  isSelected,
  isSelectionMode
}: { 
  report: StoredReport; 
  idx: number; 
  onSelect: (r: StoredReport) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.5) }} 
      onClick={() => onSelect(report)}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${
        isSelected 
          ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.05)]' 
          : 'hover:bg-foreground/[0.03] border-transparent hover:border-foreground/5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
            isSelected ? 'bg-primary/20 text-primary' : 'bg-foreground/5 opacity-40 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary'
          }`}>
            {report.sourceType === 'web' ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <h4 className={`text-[11px] font-bold uppercase tracking-widest leading-none truncate max-w-[200px] ${isSelected ? 'text-primary' : ''}`}>
              {report?.title || 'UNTITLED REPORT'}
            </h4>
            <p className="text-[9px] opacity-40 line-clamp-1 leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] font-mono opacity-40 flex items-center gap-1.5 justify-end">
            <Clock className="h-2.5 w-2.5" />
            {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'RECENT'}
          </p>
          <Badge className={`mt-2 text-[8px] border-none ${
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-foreground/40 group-hover:bg-primary/20 group-hover:text-primary'
          }`}>
            {report.confidenceScore}% ACCURACY
          </Badge>
        </div>
      </div>
    </motion.div>
  );
});

HistoryItem.displayName = "HistoryItem";

export function ReportHistory({ reports, onSelect, onSelectMultiple, selectedIds = [] }: ReportHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);

  const filteredReports = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return reports;
    return reports.filter(r => 
      r && (
        (r.title && r.title.toLowerCase().includes(term)) ||
        (r.executiveSummary && r.executiveSummary.toLowerCase().includes(term))
      )
    );
  }, [reports, deferredSearch]);

  return (
    <Card className="border-foreground/5 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
      <CardHeader className="border-b border-foreground/5 bg-foreground/[0.02] py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">CareLink Archive</CardTitle>
            {onSelectMultiple && (
              <p className="text-[8px] opacity-30 uppercase tracking-widest font-mono">Shift+Click to multi-select for regional synthesis</p>
            )}
          </div>
          <Badge variant="outline" className="text-[8px] opacity-40">{reports.length} FIELD_LOGS</Badge>
        </div>
        <input 
          type="text"
          placeholder="FILTER IMPACT DATA..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mt-4 bg-transparent border-b border-foreground/10 py-2 text-[10px] font-mono focus:outline-none focus:border-primary transition-all uppercase tracking-widest placeholder:opacity-20"
        />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {filteredReports.map((report, idx) => (
              <HistoryItem 
                key={`report-history-item-${report.id || idx}`} 
                report={report} 
                idx={idx} 
                onSelect={onSelect} 
                isSelected={selectedIds.includes(report.id || '')}
              />
            ))}
            {filteredReports.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-20">No archived sessions found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
