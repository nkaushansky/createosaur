import { useState, useCallback } from 'react';

export interface DinosaurPreset {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  dinosaurs: any[];
  selectedColors: string[];
  selectedPattern: string;
  colorEffects: string[];
  selectedTexture: string;
  creatureSize: number;
  ageStage: 'juvenile' | 'adult';
  traitSelections: any;
}

export const usePresetManager = () => {
  const [presets, setPresets] = useState<DinosaurPreset[]>(() => {
    try {
      const saved = localStorage.getItem('dinosaur-presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const savePreset = useCallback((preset: Omit<DinosaurPreset, 'id' | 'timestamp'>) => {
    const newPreset: DinosaurPreset = {
      ...preset,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const updatedPresets = [newPreset, ...presets].slice(0, 20); // Keep only latest 20
    setPresets(updatedPresets);
    
    try {
      localStorage.setItem('dinosaur-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }

    return newPreset;
  }, [presets]);

  const deletePreset = useCallback((id: string) => {
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    
    try {
      localStorage.setItem('dinosaur-presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  }, [presets]);

  const loadPreset = useCallback((preset: DinosaurPreset) => {
    return {
      dinosaurs: preset.dinosaurs,
      selectedColors: preset.selectedColors,
      selectedPattern: preset.selectedPattern,
      colorEffects: preset.colorEffects,
      selectedTexture: preset.selectedTexture,
      creatureSize: preset.creatureSize,
      ageStage: preset.ageStage,
      traitSelections: preset.traitSelections,
    };
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
    loadPreset,
  };
};