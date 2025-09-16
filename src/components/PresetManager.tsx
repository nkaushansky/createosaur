import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { DinosaurPreset, usePresetManager } from '@/hooks/usePresetManager';
import { Save, FolderOpen, Trash2, Clock, Dna } from 'lucide-react';

interface PresetManagerProps {
  currentState: {
    dinosaurs: any[];
    selectedColors: string[];
    selectedPattern: string;
    colorEffects: string[];
    selectedTexture: string;
    creatureSize: number;
    ageStage: 'juvenile' | 'adult';
    traitSelections: any;
  };
  onLoadPreset: (state: any) => void;
}

export const PresetManager = ({ currentState, onLoadPreset }: PresetManagerProps) => {
  const { presets, savePreset, deletePreset, loadPreset } = usePresetManager();
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    const preset = savePreset({
      name: presetName.trim(),
      description: presetDescription.trim(),
      ...currentState,
    });

    toast({
      title: "Success",
      description: `Preset "${preset.name}" saved successfully`,
    });

    setPresetName('');
    setPresetDescription('');
    setSaveDialogOpen(false);
  };

  const handleLoadPreset = (preset: DinosaurPreset) => {
    const state = loadPreset(preset);
    onLoadPreset(state);
    
    toast({
      title: "Success",
      description: `Preset "${preset.name}" loaded`,
    });
    
    setLoadDialogOpen(false);
  };

  const handleDeletePreset = (preset: DinosaurPreset) => {
    deletePreset(preset.id);
    toast({
      title: "Success",
      description: `Preset "${preset.name}" deleted`,
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActiveDinosaurs = (dinosaurs: any[]) => {
    return dinosaurs.filter(d => d.percentage > 0);
  };

  return (
    <div className="flex gap-2">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="btn-lab">
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Save DNA Configuration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preset Name</label>
              <Input
                placeholder="e.g., Apex Predator, Flying Terror..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <Textarea
                placeholder="Describe this genetic combination..."
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                className="bg-input border-border min-h-[80px]"
              />
            </div>

            <div className="bg-secondary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Species: {getActiveDinosaurs(currentState.dinosaurs).length} active</div>
                <div>Size: {currentState.creatureSize}% scale</div>
                <div>Age: {currentState.ageStage}</div>
                <div>Colors: {currentState.selectedColors.length}</div>
                <div>Effects: {currentState.colorEffects.length}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSavePreset} className="btn-genetic flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Preset
              </Button>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="btn-lab" disabled={presets.length === 0}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="glass border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Load DNA Configuration
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {presets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dna className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved presets yet</p>
                  <p className="text-sm">Save your current configuration to create your first preset</p>
                </div>
              ) : (
                presets.map((preset) => (
                  <Card key={preset.id} className="glass p-4 hover-glow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{preset.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getActiveDinosaurs(preset.dinosaurs).length} species
                          </Badge>
                        </div>
                        
                        {preset.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {preset.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(preset.timestamp)}
                          </div>
                          <div>{preset.creatureSize}% scale</div>
                          <div>{preset.ageStage}</div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getActiveDinosaurs(preset.dinosaurs).map((dino, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {dino.name} ({dino.percentage}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadPreset(preset)}
                          className="btn-genetic"
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePreset(preset)}
                          className="text-destructive border-destructive/50 hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};