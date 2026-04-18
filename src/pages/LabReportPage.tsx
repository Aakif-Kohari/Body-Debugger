import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Upload, FileText, CheckCircle2, AlertCircle, Info, Stethoscope, ArrowLeft, History, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';
import { format } from 'date-fns';

export default function LabReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await apiService.getLabReports();
      if (data && data.reports) {
        setHistory(data.reports);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  React.useEffect(() => {
    loadHistory();
  }, []);

  const mapAnalysisToUI = (analysis: any) => {
    return {
      summary: analysis.overall_health_assessment || analysis.summary_for_doctor || analysis.summary,
      results: (analysis.parameters || []).map((p: any) => ({
        name: p.parameter_name,
        value: p.user_value,
        unit: "", 
        range: p.normal_range,
        status: (p.risk_flag === "green" || p.risk_flag?.toLowerCase() === "normal") ? "normal" : 
               (p.risk_flag === "yellow" ? "low" : "high"), 
        meaning: p.plain_english_meaning,
        tip: p.lifestyle_tip
      })),
      lifestyleTips: analysis.recommendations || [],
      doctorQuestions: [analysis.summary_for_doctor || "Discuss these findings with doctor."]
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processReport = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      // Send the file directly to our newly fortified Python backend which avoids API limits
      const data = await apiService.uploadLabReport(file);
      
      if (!data || !data.analysis) {
         throw new Error("No analysis returned from backend");
      }

      // Map the Python backend's schema (which we fixed) to the React UI's expected schema
      const mappedResults = mapAnalysisToUI(data.analysis);

      setResults(mappedResults);
      loadHistory(); // Refresh history after new upload
    } catch (error: any) {
      console.error("AI Analysis failed backend route", error);
      alert(`Failed to analyze report: ${error.message || "Please try again."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-2xl mx-auto text-text-main">
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent">Lab Translator</h1>
                <p className="text-text-muted leading-relaxed">Upload your blood test results and we'll decode them for you in plain English.</p>
              </div>

              {/* Upload Zone */}
              <div className={cn(
                "relative h-72 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all duration-300 overflow-hidden shadow-2xl group",
                file ? "border-primary-teal bg-primary-teal/5" : "border-white/10 hover:border-primary-teal/30 glass"
              )}>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                
                {file ? (
                  <div className="text-center animate-in fade-in zoom-in">
                    <div className="w-20 h-20 bg-primary-teal text-bg-dark rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(45,212,191,0.4)]">
                      <FileText size={40} />
                    </div>
                    <p className="font-black text-lg">{file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 glass text-primary-teal rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={40} />
                    </div>
                    <p className="font-black text-xl">Drag or tap reports</p>
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Photos or PDFs</p>
                  </>
                )}
                
                {/* Glow decor for upload zone */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-teal/5 rounded-full blur-3xl opacity-50" />
              </div>

              <button
                disabled={!file || isProcessing}
                onClick={processReport}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl",
                  file && !isProcessing ? "bg-primary-teal text-bg-dark hover:shadow-[0_0_30px_rgba(45,212,191,0.3)]" : "bg-white/5 text-text-muted/20 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="w-6 h-6 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
                    DECODING BIOMARKERS...
                  </>
                ) : (
                  "Translate Report"
                )}
              </button>

              {/* History Section */}
              <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-text-muted">
                    <History size={18} />
                    <h2 className="font-black uppercase tracking-widest text-sm">Recent Translations</h2>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">{history.length} Reports</span>
                </div>

                <div className="grid gap-4">
                  {history.length > 0 ? (
                    history.map((report) => (
                      <motion.div
                        key={report.report_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass p-5 rounded-3xl flex items-center justify-between group hover:border-primary-teal/30 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => setResults(mapAnalysisToUI(report.analysis))}
                      >
                        <div className="flex items-center gap-4 z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted group-hover:bg-primary-teal/10 group-hover:text-primary-teal transition-all">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-black text-white group-hover:text-primary-teal transition-colors">
                              {format(new Date(report.uploaded_at), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                              {report.analysis.parameters?.length || 0} Markers Analyzed
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this report permanently?")) {
                                setDeletingId(report.report_id);
                                apiService.deleteLabReport(report.report_id)
                                  .then(() => loadHistory())
                                  .finally(() => setDeletingId(null));
                              }
                            }}
                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="p-2.5 rounded-xl bg-white/5 text-text-muted group-hover:bg-primary-teal group-hover:text-bg-dark transition-all">
                            <ArrowRight size={18} />
                          </div>
                        </div>

                        {/* Sparkle decor */}
                        {deletingId === report.report_id && (
                          <div className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="w-5 h-5 border-2 border-primary-teal border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : isLoadingHistory ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <div className="w-8 h-8 border-2 border-white/10 border-t-primary-teal rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/40">Fetching History...</p>
                    </div>
                  ) : (
                    <div className="glass p-10 rounded-[2.5rem] border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-40">
                       <FileText size={30} className="mb-3" />
                       <p className="text-xs font-bold uppercase tracking-widest">No previous reports found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setResults(null)}
                className="flex items-center gap-2 text-primary-teal font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              >
                <ArrowLeft size={18} />
                Upload New
              </button>

              <div className="glass rounded-[2rem] p-8 border-white/10 shadow-3xl text-left bg-gradient-to-br from-white/10 to-transparent">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-teal mb-4 block">Executive Summary</span>
                <h2 className="text-2xl font-black mb-3 text-white">Analysis Ready</h2>
                <p className="text-sm leading-relaxed text-text-muted">{results.summary}</p>
              </div>

              <div className="space-y-6">
                <h3 className="font-black text-lg px-2 uppercase tracking-widest text-text-muted">Biomarker Catalog</h3>
                {results.results.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-[2rem] space-y-4 border-white/5 relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start z-10 relative">
                      <div className="space-y-1">
                        <h4 className="font-black text-xl text-white group-hover:text-primary-teal transition-colors">{item.name}</h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                          Ref Range: {item.range}
                        </p>
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em]",
                        item.status === 'normal' 
                          ? "bg-primary-teal/10 text-primary-teal border border-primary-teal/20" 
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                        {item.status}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 z-10 relative">
                      <span className="text-4xl font-black text-white">{item.value}</span>
                      <span className="text-sm font-bold text-text-muted">{item.unit}</span>
                    </div>

                    <div className="bg-white/5 p-4 rounded-3xl flex gap-4 text-sm leading-relaxed z-10 relative">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                        <Info size={18} className="text-primary-teal opacity-70" />
                      </div>
                      <p className="text-text-muted">{item.meaning}</p>
                    </div>

                    <div className="bg-primary-teal/5 p-4 rounded-3xl flex gap-4 text-sm font-bold text-primary-teal border border-primary-teal/10 z-10 relative">
                       <CheckCircle2 size={18} className="shrink-0" />
                       <p>{item.tip}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Doctor Summary Section */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center gap-3 text-red-400 font-black px-2 uppercase tracking-widest">
                  <Stethoscope size={22} />
                  <h3>Physician Consultation</h3>
                </div>
                <div className="grid gap-4">
                  {results.doctorQuestions.map((q: string, i: number) => (
                    <div key={i} className="glass p-5 rounded-3xl text-sm border-red-500/10 text-text-muted leading-relaxed hover:border-red-500/30 transition-colors">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
