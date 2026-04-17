/**
 * Fallback storage service using LocalStorage
 * This will be replaced by Firebase once provisioning is successful.
 */

import { DailyStats, HealthLog, LabReport } from '../types';

const KEYS = {
  STATS: 'body_debugger_stats',
  LOGS: 'body_debugger_logs',
  REPORTS: 'body_debugger_reports',
};

export const storageService = {
  getStats(): DailyStats {
    const saved = localStorage.getItem(KEYS.STATS);
    return saved ? JSON.parse(saved) : {
      water: 0,
      sleep: 0,
      calories: 0,
      screenTime: 0,
      mood: 5
    };
  },

  saveStats(stats: DailyStats) {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getLogs(): HealthLog[] {
    const saved = localStorage.getItem(KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  },

  addLog(log: Omit<HealthLog, 'id' | 'timestamp'>) {
    const logs = this.getLogs();
    const newLog: HealthLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    logs.push(newLog);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    
    // Update aggregate stats
    const stats = this.getStats();
    if (log.type === 'water') stats.water += log.value;
    if (log.type === 'sleep') stats.sleep = log.value;
    if (log.type === 'food') stats.calories += log.value;
    if (log.type === 'screen') stats.screenTime += log.value;
    if (log.type === 'mood') stats.mood = log.value;
    this.saveStats(stats);
    
    return newLog;
  },

  getReports(): LabReport[] {
    const saved = localStorage.getItem(KEYS.REPORTS);
    return saved ? JSON.parse(saved) : [];
  },

  saveReport(report: Omit<LabReport, 'id' | 'timestamp'>) {
    const reports = this.getReports();
    const newReport: LabReport = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    reports.push(newReport);
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
    return newReport;
  }
};
