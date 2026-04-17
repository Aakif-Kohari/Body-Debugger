import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { FileText, Pill, ClipboardList, Download, Trash2, Eye, Upload, Calendar, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiService } from '../services/api';

interface HealthRecord {
  id: string;
  record_type: 'prescription' | 'report' | 'notes';
  label: string;
  file_url?: string;
  uploaded_at: string;
  doctor_name?: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'prescription' | 'report' | 'notes'>('all');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await apiService.getHealthRecords();
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to load records:', err);
      setError('Failed to load health records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Determine record type based on file type
      let recordType: 'prescription' | 'report' | 'notes' = 'report';
      if (file.type.includes('pdf') || file.name.toLowerCase().includes('prescription')) {
        recordType = 'prescription';
      } else if (file.name.toLowerCase().includes('note') || file.name.toLowerCase().includes('doctor')) {
        recordType = 'notes';
      }

      await apiService.uploadHealthRecord(file, {
        record_type: recordType,
        label: file.name.replace(/\.[^/.]+$/, "") // Remove file extension
      });

      await loadRecords();
    } catch (err) {
      console.error('Failed to upload record:', err);
      setError('Failed to upload record. Please try again.');
    } finally {
      setUploading(false);
    }

    // Reset input
    event.target.value = '';
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      setError(null);
      await apiService.deleteHealthRecord(recordId);
      await loadRecords();
      setSelectedRecord(null);
    } catch (err) {
      console.error('Failed to delete record:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  const filteredRecords = selectedTab === 'all'
    ? records
    : records.filter(r => r.record_type === selectedTab);

  const recordTypeConfig = {
    prescription: { icon: <Pill size={24} />, label: 'Prescription', color: 'accent-pink' },
    report: { icon: <FileText size={24} />, label: 'Lab Report', color: 'primary-teal' },
    notes: { icon: <ClipboardList size={24} />, label: 'Doctor Notes', color: 'accent-blue' }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-health-primary text-xl">Loading health records...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-4xl mx-auto text-text-main">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Health Records Vault</h1>
          <p className="text-text-muted">Your medical history. Secure. Organized.</p>
        </div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2.5rem] p-8 border-2 border-dashed border-primary-teal/30 hover:border-primary-teal/60 shadow-2xl transition-all group cursor-pointer relative"
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="flex items-center justify-center flex-col gap-4">
            <div className={cn(
              "w-16 h-16 glass rounded-2xl flex items-center justify-center text-primary-teal group-hover:scale-110 transition-transform group-hover:shadow-lg group-hover:shadow-primary-teal/20",
              uploading && "animate-pulse"
            )}>
              {uploading ? (
                <div className="w-8 h-8 border-2 border-primary-teal border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={32} />
              )}
            </div>
            <div className="text-center">
              <p className="font-black text-lg">{uploading ? 'Uploading...' : 'Add New Record'}</p>
              <p className="text-sm text-text-muted">Prescriptions, reports, or doctor notes</p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(['all', 'prescription', 'report', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={cn(
                "px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all flex items-center gap-2",
                selectedTab === tab
                  ? "bg-primary-teal text-bg-dark shadow-lg shadow-primary-teal/20"
                  : "bg-white/5 text-text-muted border border-white/10 hover:bg-white/10"
              )}
            >
              {tab === 'all' && <span>All Records</span>}
              {tab === 'prescription' && <><Pill size={18} /> Prescriptions</>}
              {tab === 'report' && <><FileText size={18} /> Reports</>}
              {tab === 'notes' && <><ClipboardList size={18} /> Notes</>}
            </button>
          ))}
        </div>

        {/* Records Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRecords.map((record, i) => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer"
              >
                <div
                  onClick={() => setSelectedRecord(record)}
                  className="glass rounded-[2.5rem] p-6 border-white/10 shadow-2xl overflow-hidden hover:border-white/20 hover:shadow-2xl transition-all"
                >
                  {/* Type Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      `text-${recordTypeConfig[record.record_type].color}`
                    )}>
                      {recordTypeConfig[record.record_type].icon}
                    </div>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                      `bg-${recordTypeConfig[record.record_type].color}/10 text-${recordTypeConfig[record.record_type].color}`
                    )}>
                      {recordTypeConfig[record.record_type].label}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-black text-lg mb-3 group-hover:text-primary-teal transition-colors">
                    {record.label}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-2 text-sm text-text-muted mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(record.uploaded_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    {record.doctor_name && (
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        {record.doctor_name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 rounded-lg bg-primary-teal text-bg-dark font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-teal/20 transition-all active:scale-95">
                      <Eye size={16} />
                      View
                    </button>
                    {record.file_url && (
                      <a
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-white/5 text-text-muted hover:bg-white/10 hover:text-primary-teal transition-all border border-white/10"
                      >
                        <Download size={16} />
                      </a>
                    )}
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteRecord(record.id);
                      }}
                      className="p-3 rounded-lg bg-white/5 text-text-muted hover:bg-red-400/10 hover:text-red-400 transition-all border border-white/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-[2.5rem] p-12 text-center border-white/10 shadow-2xl"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-black mb-2">No Records Yet</h3>
            <p className="text-text-muted mb-6">Upload your first health document to get started</p>
            <button className="px-6 py-3 rounded-xl bg-primary-teal text-bg-dark font-black hover:shadow-lg hover:shadow-primary-teal/20 transition-all">
              Upload Record
            </button>
          </motion.div>
        )}

        {/* Record Detail Modal */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass rounded-[2.5rem] max-w-2xl w-full max-h-[80vh] overflow-y-auto border-white/10 shadow-2xl"
              >
                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center",
                          `text-${recordTypeConfig[selectedRecord.record_type].color}`
                        )}>
                          {recordTypeConfig[selectedRecord.record_type].icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black">{selectedRecord.label}</h2>
                          <p className={cn(
                            "text-sm font-black uppercase tracking-widest",
                            `text-${recordTypeConfig[selectedRecord.record_type].color}`
                          )}>
                            {recordTypeConfig[selectedRecord.record_type].label}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(null)}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Info */}
                  <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/10">
                    <div>
                      <p className="text-xs uppercase font-black text-text-muted tracking-widest mb-2">Date</p>
                      <p className="text-lg font-bold">
                        {new Date(selectedRecord.uploaded_at).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {selectedRecord.doctor_name && (
                      <div>
                        <p className="text-xs uppercase font-black text-text-muted tracking-widest mb-2">Doctor</p>
                        <p className="text-lg font-bold">{selectedRecord.doctor_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {selectedRecord.file_url && (
                      <a
                        href={selectedRecord.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 rounded-2xl bg-primary-teal text-bg-dark font-black hover:shadow-lg hover:shadow-primary-teal/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={20} />
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteRecord(selectedRecord.id)}
                      className="flex-1 py-4 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 font-black hover:bg-red-400/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={20} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-6 border-red-400/20 bg-red-400/5"
          >
            <p className="text-red-400 font-bold">{error}</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
