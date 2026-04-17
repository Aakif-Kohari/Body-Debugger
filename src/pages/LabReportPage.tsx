import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { Upload, FileText, CheckCircle2, AlertCircle, Info, Stethoscope, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';

export default function LabReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processReport = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    // Convert to base64 for Gemini
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await geminiService.analyzeLabReport(base64, file.type);
        setResults(data);
      } catch (error) {
        console.error("AI Analysis failed", error);
        alert("Failed to analyze report. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
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
