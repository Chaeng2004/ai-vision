import { useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ScanHistoryItem } from '../types';

interface HistoryStats {
  total: number;
  goCount: number;
  nogoCount: number;
  cautionCount: number;
  safeRate: number; // percentage 0-100
}

interface UseHistoryReturn {
  history: ScanHistoryItem[];
  stats: HistoryStats;
  isEmpty: boolean;
  lastScan: ScanHistoryItem | null;
  addScan: (item: ScanHistoryItem) => void;
  removeScan: (id: string) => void;
  clearHistory: () => void;
  getById: (id: string) => ScanHistoryItem | undefined;
}

export function useHistory(): UseHistoryReturn {
  const history = useAppStore((s) => s.history);
  const addScan = useAppStore((s) => s.addScan);
  const removeScan = useAppStore((s) => s.removeScan);
  const clearHistory = useAppStore((s) => s.clearHistory);

  const stats = useMemo<HistoryStats>(() => {
    const total = history.length;
    const goCount = history.filter((h) => h.result.status === 'GO').length;
    const nogoCount = history.filter((h) => h.result.status === 'NO_GO').length;
    const cautionCount = history.filter((h) => h.result.status === 'CAUTION').length;
    const safeRate = total > 0 ? Math.round((goCount / total) * 100) : 0;
    return { total, goCount, nogoCount, cautionCount, safeRate };
  }, [history]);

  const getById = useCallback(
    (id: string) => history.find((h) => h.id === id),
    [history]
  );

  return {
    history,
    stats,
    isEmpty: history.length === 0,
    lastScan: history[0] ?? null,
    addScan,
    removeScan,
    clearHistory,
    getById,
  };
}