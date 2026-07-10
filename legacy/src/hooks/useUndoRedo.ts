import { useState, useCallback } from 'react';

export interface HistoryState {
  dinosaurs: any[];
  selectedColors: string[];
  selectedPattern: string;
  colorEffects: string[];
  selectedTexture: string;
  creatureSize: number;
  ageStage: 'juvenile' | 'adult';
  traitSelections: any;
}

export const useUndoRedo = (initialState: HistoryState) => {
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const pushState = useCallback((state: HistoryState) => {
    setHistory(prev => {
      // Remove any future states when pushing new state
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(state);
      
      // Keep only last 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      return newIndex;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState: history[currentIndex],
  };
};
