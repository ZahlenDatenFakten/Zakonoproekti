import { useState, useCallback, useRef, useEffect } from 'react';
import type { Bill } from '../types/bill';

export interface UseBillHistoryReturn {
  bill: Bill;
  setBill: (action: Bill | ((prev: Bill) => Bill)) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  futureLength: number;
  resetHistory: (newBill?: Bill) => void;
}

const MAX_HISTORY_STEPS = 150;

/**
 * Robust Undo/Redo history hook for legislative bill drafts.
 * Supports granular single-character keystroke rollback, row operations,
 * and comprehensive state snapshotting without memory leaks.
 */
export function useBillHistory(initialBill: Bill): UseBillHistoryReturn {
  const [history, setHistory] = useState<{
    past: Bill[];
    present: Bill;
    future: Bill[];
  }>({
    past: [],
    present: initialBill,
    future: [],
  });

  // Track initial bill identity to reset on id switch
  const lastIdRef = useRef(initialBill.id);
  useEffect(() => {
    if (initialBill.id !== lastIdRef.current) {
      lastIdRef.current = initialBill.id;
      setHistory({
        past: [],
        present: initialBill,
        future: [],
      });
    }
  }, [initialBill.id]);

  /**
   * Set bill state with history recording.
   * Clears future (redo) stack on forward edits.
   */
  const setBill = useCallback((action: Bill | ((prev: Bill) => Bill)) => {
    setHistory((curr) => {
      const nextPresent = typeof action === 'function' ? action(curr.present) : action;

      // Identity check: avoid redundant duplicate snapshots
      if (nextPresent === curr.present) {
        return curr;
      }

      const newPast = [...curr.past, curr.present];
      if (newPast.length > MAX_HISTORY_STEPS) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: nextPresent,
        future: [], // New user edit breaks redo chain
      };
    });
  }, []);

  /**
   * Undo last change (reverts to previous snapshot)
   */
  const undo = useCallback((): boolean => {
    let success = false;
    setHistory((curr) => {
      if (curr.past.length === 0) {
        return curr;
      }

      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);
      const newFuture = [curr.present, ...curr.future];
      success = true;

      return {
        past: newPast,
        present: previous,
        future: newFuture,
      };
    });
    return success;
  }, []);

  /**
   * Redo previously undone change
   */
  const redo = useCallback((): boolean => {
    let success = false;
    setHistory((curr) => {
      if (curr.future.length === 0) {
        return curr;
      }

      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      const newPast = [...curr.past, curr.present];
      if (newPast.length > MAX_HISTORY_STEPS) {
        newPast.shift();
      }
      success = true;

      return {
        past: newPast,
        present: next,
        future: newFuture,
      };
    });
    return success;
  }, []);

  /**
   * Clear history and optionally seed with a new bill
   */
  const resetHistory = useCallback((newBill?: Bill) => {
    setHistory((curr) => ({
      past: [],
      present: newBill || curr.present,
      future: [],
    }));
  }, []);

  return {
    bill: history.present,
    setBill,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historyLength: history.past.length,
    futureLength: history.future.length,
    resetHistory,
  };
}
