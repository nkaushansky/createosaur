import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DinosaurCard, TraitSelection, TraitState } from "./DinosaurCard";
import { AddSpeciesSelector } from "./AddSpeciesSelector";
import { ColorPalette } from "./ColorPalette";
import { PatternSelector } from "./PatternSelector";
import { SizeScaler } from "./SizeScaler";
import { AgeVariation } from "./AgeVariation";
import { ScientificProfile } from "./ScientificProfile";
import { ResultsDisplay } from "./ResultsDisplay";
import { PresetManager } from "./PresetManager";
import { UndoRedoControls } from "./UndoRedoControls";
import { AdvancedLoading } from "./LoadingStates";
import { AdvancedGeneration, GenerationParams } from "./AdvancedGeneration";
import { ShareExport } from "./ShareExport";
import { BackgroundSelector } from "./BackgroundSelector";
import { GenerationGallery } from "./GenerationGallery";
import { CommunityGallery } from "./CommunityGallery";
import { HeaderAuth } from "./HeaderAuth";
import { BehavioralSimulator } from "@/utils/BehavioralSimulator";
import { ScientificNameGenerator } from "@/utils/ScientificNameGenerator";
import { useUndoRedo, HistoryState } from "@/hooks/useUndoRedo";
import { useGeneration } from "@/hooks/useGeneration";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DemoModeBanner } from "./APIKeySetup";
import { Settings as SettingsComponent } from "./Settings";
import { getRandomDinosaurs } from "@/data/dinosaurDatabase";
import { DatabaseCreature } from "@/services/creatureService";
import { Dna, Zap, Beaker, X, Settings, Shuffle, Globe } from "lucide-react";

/**
 * Core dinosaur data structure for genetic mixing
 */
interface DinosaurData {
  id: string;
  name: string;
  scientificName: string;
  period: string;
  traits: string[];
  percentage: number;
}

const initialDinosaurs: DinosaurData[] = [
  {
    id: "trex",
    name: "Tyrannosaurus Rex",
    scientificName: "Tyrannosaurus rex",
    period: "Late Cretaceous",
    traits: ["Massive jaw", "Powerful legs", "Sharp teeth", "Apex predator"],
    percentage: 25,
  },
  {
    id: "triceratops",
    name: "Triceratops",
    scientificName: "Triceratops horridus",
    period: "Late Cretaceous",
    traits: ["Triple horns", "Protective frill", "Herbivore", "Sturdy build"],
    percentage: 25,
  },
  {
    id: "velociraptor",
    name: "Velociraptor",
    scientificName: "Velociraptor mongoliensis",
    period: "Late Cretaceous",
    traits: ["Pack hunter", "Sickle claws", "High intelligence", "Feathered"],
    percentage: 25,
  },
  {
    id: "stegosaurus",
    name: "Stegosaurus",
    scientificName: "Stegosaurus stenops",
    period: "Late Jurassic",
    traits: ["Back plates", "Spiked tail", "Herbivore", "Armored"],
    percentage: 25,
  },
];

interface GeneticLabProps {
  /** Optional callback triggered when a new creature is successfully generated */
  onNewCreature?: (creature: any) => void;
  /** Optional parameters for regenerating a specific creature */
  regenerationParams?: {
    species?: string[];
    traits?: Record<string, any>;
    customPrompt?: string;
    provider?: string;
  };
}

/**
 * GeneticLab - Main component for dinosaur genetic engineering
 * 
 * This is the core component that orchestrates the entire creature generation
 * process. It provides a comprehensive interface for:
 * 
 * - DNA mixing from multiple dinosaur species
 * - Trait selection and customization
 * - Color, pattern, and texture configuration
 * - Size and age variation controls
 * - AI-powered image generation with multiple providers
 * - Scientific analysis and naming
 * - Gallery management and organization
 * 
 * The component maintains complex state for genetic configurations, handles
 * undo/redo operations, manages AI provider fallbacks, and provides real-time
 * feedback during generation processes.
 * 
 * @param props - Component props including optional creature creation callback
 * @returns JSX element containing the complete genetic lab interface
 */
export const GeneticLab = ({ onNewCreature, regenerationParams }: GeneticLabProps = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use generation hook for proper routing
  const { generateCreatures, isGenerating: hookIsGenerating } = useGeneration({
    onNewCreature: (creature) => {
      setCurrentBatch(prev => [...prev, creature]);
      onNewCreature?.(creature);
    },
    onProgress: (stage, progress) => {
      setLoadingStage(stage);
      setLoadingProgress(progress);
    }
  });
  
  // Check for API key in localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('VITE_HUGGINGFACE_API_KEY');
    if (storedApiKey) {
      console.log('🔑 Found stored API key, AI generation available');
    } else {
      console.log('🎭 No API key found, demo mode will be used');
    }
  }, []);

  // Handle regeneration parameters when provided
  useEffect(() => {
    if (regenerationParams) {
      console.log('🔄 Applying regeneration parameters:', regenerationParams);
      
      // Apply species if provided
      if (regenerationParams.species && regenerationParams.species.length > 0) {
        const regeneratedDinosaurs = regenerationParams.species.map((speciesName, index) => ({
          id: `regen-${index}`,
          name: speciesName,
          scientificName: `${speciesName} sp.`,
          period: 'Mixed Period',
          traits: regenerationParams.traits?.[speciesName] || [],
          percentage: Math.round(100 / regenerationParams.species.length)
        }));
        setDinosaurs(regeneratedDinosaurs);
      }

      // Apply custom traits if provided
      if (regenerationParams.traits) {
        setTraitSelections(regenerationParams.traits);
      }

      // Store custom prompt for generation
      if (regenerationParams.customPrompt) {
        // Will be used during generation
        console.log('📝 Custom prompt provided:', regenerationParams.customPrompt);
      }

      // Show toast notification
      toast({
        title: "Regeneration Parameters Applied",
        description: "Lab configured to recreate similar creature",
      });
    }
  }, [regenerationParams, toast]);

  // Check if we're in demo mode - now checks all possible providers
  const hasAnyApiKey = localStorage.getItem('VITE_HUGGINGFACE_API_KEY') || 
                      localStorage.getItem('VITE_OPENAI_API_KEY') || 
                      localStorage.getItem('VITE_STABILITY_API_KEY');
  const isDemoMode = !hasAnyApiKey && 
                     !import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  // Core state
  const [dinosaurs, setDinosaurs] = useState<DinosaurData[]>(initialDinosaurs);
  const [selectedColors, setSelectedColors] = useState<string[]>(["#00ffff", "#00ff00"]);
  const [selectedPattern, setSelectedPattern] = useState("stripes");
  const [selectedBackground, setSelectedBackground] = useState<string>('jungle');
  const [backgroundSettings, setBackgroundSettings] = useState({
    lighting: 50,
    atmosphere: 30,
    weatherEffect: "none",
    timeOfDay: "day"
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [traitSelections, setTraitSelections] = useState<{[dinosaurId: string]: TraitSelection}>({});
  
  // Enhanced customization state
  const [colorEffects, setColorEffects] = useState<string[]>([]);
  const [selectedTexture, setSelectedTexture] = useState("scales");
  const [creatureSize, setCreatureSize] = useState(50);
  const [ageStage, setAgeStage] = useState<'juvenile' | 'adult'>('adult');

  // Advanced loading state
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Phase 5: Advanced Generation & Gallery
  const [generatedCreatures, setGeneratedCreatures] = useState<any[]>([]);
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [isCommunityGalleryOpen, setIsCommunityGalleryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize undo/redo system
  const initialHistoryState: HistoryState = {
    dinosaurs: initialDinosaurs,
    selectedColors: ["#00ffff", "#00ff00"],
    selectedPattern: "stripes",
    colorEffects: [],
    selectedTexture: "scales",
    creatureSize: 50,
    ageStage: 'adult',
    traitSelections: {},
  };

  const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo(initialHistoryState);

  // Save state to history when changes occur
  const saveStateToHistory = useCallback(() => {
    const currentState: HistoryState = {
      dinosaurs,
      selectedColors,
      selectedPattern,
      colorEffects,
      selectedTexture,
      creatureSize,
      ageStage,
      traitSelections,
    };
    pushState(currentState);
  }, [dinosaurs, selectedColors, selectedPattern, colorEffects, selectedTexture, creatureSize, ageStage, traitSelections, pushState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate scientific profile based on current selections
  const scientificProfile = useMemo(() => {
    const activeDinosaurs = dinosaurs.filter(d => d.percentage > 0);
    if (activeDinosaurs.length === 0) return null;

    const behavioralProfile = BehavioralSimulator.generateBehavioralProfile(
      activeDinosaurs,
      traitSelections,
      ageStage
    );

    const scientificName = ScientificNameGenerator.generateScientificName(
      activeDinosaurs,
      traitSelections,
      creatureSize,
      behavioralProfile.temperament
    );

    return { behavioralProfile, scientificName };
  }, [dinosaurs, traitSelections, ageStage, creatureSize]);

  // Enhanced state update functions with history tracking
  const updatePercentage = useCallback((id: string, newPercentage: number) => {
    setDinosaurs(prev => 
      prev.map(dino => 
        dino.id === id ? { ...dino, percentage: newPercentage } : dino
      )
    );
    // Auto-save to history after a delay to avoid too many history entries
    setTimeout(saveStateToHistory, 1000);
  }, [saveStateToHistory]);

  const addSpecies = useCallback((newSpecies: DinosaurData) => {
    const speciesWithPercentage = { ...newSpecies, percentage: 0 };
    setDinosaurs(prev => [...prev, speciesWithPercentage]);
    saveStateToHistory();
  }, [saveStateToHistory]);

  const removeSpecies = useCallback((id: string) => {
    setDinosaurs(prev => prev.filter(dino => dino.id !== id));
    setTraitSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[id];
      return newSelections;
    });
    saveStateToHistory();
  }, [saveStateToHistory]);

  const updateTraitSelection = useCallback((dinosaurId: string, trait: string, state: TraitState) => {
    setTraitSelections(prev => ({
      ...prev,
      [dinosaurId]: {
        ...prev[dinosaurId],
        [trait]: state
      }
    }));
    setTimeout(saveStateToHistory, 1000);
  }, [saveStateToHistory]);

  const normalizePercentages = () => {
    const total = dinosaurs.reduce((sum, dino) => sum + dino.percentage, 0);
    if (total === 0) return;
    
    setDinosaurs(prev =>
      prev.map(dino => ({
        ...dino,
        percentage: Math.round((dino.percentage / total) * 100)
      }))
    );
  };

  const randomizeAll = useCallback(() => {
    // Get 4 random dinosaur species
    const randomSpecies = getRandomDinosaurs(4);
    
    // Convert to DinosaurData format with equal percentages
    const randomDinosaurs = randomSpecies.map((species, index) => ({
      id: species.id,
      name: species.name,
      scientificName: species.scientificName,
      period: species.period,
      traits: species.traits,
      percentage: 25, // Equal distribution
    }));
    
    // Random color selection (2-3 colors)
    const standardColors = [
      "#00ffff", "#00ff00", "#ff6b00", "#ff0000", "#8b00ff", 
      "#ffff00", "#ff69b4", "#00bfff", "#32cd32", "#ff4500",
      "#9400d3", "#ffd700", "#dc143c", "#00ced1", "#adff2f"
    ];
    const numColors = Math.floor(Math.random() * 2) + 2; // 2-3 colors
    const randomColors = [];
    for (let i = 0; i < numColors; i++) {
      const randomIndex = Math.floor(Math.random() * standardColors.length);
      if (!randomColors.includes(standardColors[randomIndex])) {
        randomColors.push(standardColors[randomIndex]);
      }
    }
    
    // Random pattern selection
    const patterns = ["stripes", "spots", "scales", "solid", "gradient", "camouflage", "rosettes", "mottled"];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Random texture selection
    const textures = ["smooth", "scales", "plates", "feathers", "fur", "quills", "leather"];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];
    
    // Random size (30-70 range for variety)
    const randomSize = Math.floor(Math.random() * 41) + 30; // 30-70
    
    // Apply all randomizations
    setDinosaurs(randomDinosaurs);
    setSelectedColors(randomColors);
    setSelectedPattern(randomPattern);
    setSelectedTexture(randomTexture);
    setCreatureSize(randomSize);
    
    // Clear trait selections for new species
    setTraitSelections({});
    
    // Save to history
    saveStateToHistory();
    
    toast({
      title: "Randomized!",
      description: `Selected ${randomDinosaurs.length} random species with new colors, patterns, and size`,
    });
  }, [saveStateToHistory, toast]);

  // Handle creature inspiration from community gallery
  const handleCreatureInspire = useCallback((creature: DatabaseCreature) => {
    try {
      const params = creature.generation_params;
      
      if (params) {
        // Apply species if available
        if (params.dinosaurs && Array.isArray(params.dinosaurs)) {
          setDinosaurs(params.dinosaurs);
        }
        
        // Apply colors
        if (params.selectedColors) {
          setSelectedColors(params.selectedColors);
        }
        
        // Apply pattern
        if (params.selectedPattern) {
          setSelectedPattern(params.selectedPattern);
        }
        
        // Apply texture
        if (params.selectedTexture) {
          setSelectedTexture(params.selectedTexture);
        }
        
        // Apply size
        if (params.creatureSize !== undefined) {
          setCreatureSize(params.creatureSize);
        }
        
        // Apply age stage
        if (params.ageStage) {
          setAgeStage(params.ageStage);
        }
        
        // Apply color effects
        if (params.colorEffects) {
          setColorEffects(params.colorEffects);
        }
        
        // Apply trait selections
        if (params.traitSelections) {
          setTraitSelections(params.traitSelections);
        }
        
        // Apply background
        if (params.selectedBackground) {
          setSelectedBackground(params.selectedBackground);
        }
        
        // Save to history
        saveStateToHistory();
        
        // Close the community gallery
        setIsCommunityGalleryOpen(false);
        
        toast({
          title: "Configuration Loaded!",
          description: `Using "${creature.name}" as inspiration. You can now modify and generate your own version.`,
        });
      }
    } catch (error) {
      console.error('Failed to load creature inspiration:', error);
      toast({
        title: "Load Failed",
        description: "Could not load creature configuration. Please try again.",
        variant: "destructive"
      });
    }
  }, [saveStateToHistory, toast]);

  // Enhanced generation with advanced parameters using the generation hook
  const generateHybrid = async (params?: GenerationParams) => {
    setLoadingProgress(0);
    setCurrentBatch([]);
    
    try {
      // Prepare dinosaur parameters
      const dinoParams = {
        dinosaurs,
        selectedColors,
        selectedPattern,
        colorEffects,
        selectedTexture,
        creatureSize,
        ageStage,
        traitSelections,
        backgroundSettings,
        selectedBackground
      };

      // Prepare AI generation parameters
      const aiParams = {
        promptText: params?.promptText,
        batchSize: params?.batchSize || 1,
        algorithm: params?.algorithm || "genetic",
        steps: params?.steps || 30,
        guidance: params?.guidance || 7.5,
        width: params?.width || 1024,
        height: params?.height || 1024
      };

      // Use the generation hook which handles routing
      const result = await generateCreatures(
        dinoParams,
        aiParams,
        scientificProfile
      );

      if (result.success && result.creatures.length > 0) {
        // Update state with new creatures
        setCurrentBatch(result.creatures);
        setGeneratedCreatures(prev => [...prev, ...result.creatures]);
        
        // Set the first generated image as the primary result
        if (result.creatures[0].imageUrl) {
          setGeneratedImage(result.creatures[0].imageUrl);
        } else {
          setGeneratedImage(null);
        }
        
        // Show trial status if needed
        if (result.needsUpgrade) {
          toast({
            title: "Trial Complete!",
            description: result.conversionMessage || "Ready to continue with your own API key?",
            duration: 6000
          });
        } else {
          toast({
            title: "Success!",
            description: `Generated ${result.creatures.length} hybrid creature${result.creatures.length > 1 ? 's' : ''}!`,
          });
        }
      } else {
        throw new Error('Generation failed');
      }
      
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate hybrid. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to placeholder
      setGeneratedImage(null);
    } finally {
      setLoadingStage('');
      setLoadingProgress(0);
    }
  };

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setDinosaurs(previousState.dinosaurs);
      setSelectedColors(previousState.selectedColors);
      setSelectedPattern(previousState.selectedPattern);
      setColorEffects(previousState.colorEffects);
      setSelectedTexture(previousState.selectedTexture);
      setCreatureSize(previousState.creatureSize);
      setAgeStage(previousState.ageStage);
      setTraitSelections(previousState.traitSelections);
      
      toast({
        title: "Undone",
        description: "Reverted to previous state",
      });
    }
  }, [undo, toast]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setDinosaurs(nextState.dinosaurs);
      setSelectedColors(nextState.selectedColors);
      setSelectedPattern(nextState.selectedPattern);
      setColorEffects(nextState.colorEffects);
      setSelectedTexture(nextState.selectedTexture);
      setCreatureSize(nextState.creatureSize);
      setAgeStage(nextState.ageStage);
      setTraitSelections(nextState.traitSelections);
      
      toast({
        title: "Redone",
        description: "Restored to next state",
      });
    }
  }, [redo, toast]);

  // Preset handlers
  const handleLoadPreset = useCallback((presetState: any) => {
    setDinosaurs(presetState.dinosaurs);
    setSelectedColors(presetState.selectedColors);
    setSelectedPattern(presetState.selectedPattern);
    setColorEffects(presetState.colorEffects);
    setSelectedTexture(presetState.selectedTexture);
    setCreatureSize(presetState.creatureSize);
    setAgeStage(presetState.ageStage);
    setTraitSelections(presetState.traitSelections);
    if (presetState.backgroundSettings) {
      setBackgroundSettings(presetState.backgroundSettings);
    }
    saveStateToHistory();
  }, [saveStateToHistory]);

  // Phase 5: Gallery handlers
  const handleDeleteCreature = useCallback((id: string) => {
    setGeneratedCreatures(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Creature Deleted",
      description: "Removed creature from gallery",
    });
  }, [toast]);

  const handleToggleFavorite = useCallback((id: string) => {
    setGeneratedCreatures(prev => 
      prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)
    );
  }, []);

  const handleRateCreature = useCallback((id: string, rating: number) => {
    setGeneratedCreatures(prev => 
      prev.map(c => c.id === id ? { ...c, rating } : c)
    );
  }, []);

  const handleSelectCreature = useCallback((creature: any) => {
    // Load creature's generation parameters
    const params = creature.generationParams;
    if (params) {
      setDinosaurs(params.dinosaurs);
      setSelectedColors(params.selectedColors);
      setSelectedPattern(params.selectedPattern);
      setColorEffects(params.colorEffects || []);
      setSelectedTexture(params.selectedTexture);
      setCreatureSize(params.creatureSize);
      setAgeStage(params.ageStage);
      setTraitSelections(params.traitSelections || {});
      setBackgroundSettings(params.backgroundSettings || {
        lighting: 50,
        atmosphere: 30,
        weatherEffect: "none",
        timeOfDay: "day"
      });
      saveStateToHistory();
      
      toast({
        title: "Creature Loaded",
        description: "Parameters applied to current workspace",
      });
    }
  }, [saveStateToHistory, toast]);

  const totalPercentage = dinosaurs.reduce((sum, dino) => sum + dino.percentage, 0);

  return (
    <div className="min-h-screen dna-pattern">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4 relative">
            <Dna className="w-8 h-8 text-primary animate-genetic-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Genetic Engineering Lab
            </h1>
            <Beaker className="w-8 h-8 text-accent animate-genetic-pulse" />
            
            {/* Authentication Header - positioned absolutely to the right */}
            <div className="absolute right-0">
              <HeaderAuth 
                onCommunityClick={() => setIsCommunityGalleryOpen(true)}
                onSettingsClick={() => setIsSettingsOpen(true)}
              />
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Combine dinosaur DNA to create the ultimate prehistoric hybrid. 
            Select species, adjust genetic percentages, and customize appearance.
          </p>
          
          {/* Demo Mode Banner */}
          {isDemoMode && <DemoModeBanner />}
          
          {/* Enhanced Controls Bar */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <UndoRedoControls 
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
            <PresetManager 
              currentState={{
                dinosaurs,
                selectedColors,
                selectedPattern,
                colorEffects,
                selectedTexture,
                creatureSize,
                ageStage,
                traitSelections,
              }}
              onLoadPreset={handleLoadPreset}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* DNA Selection Panel */}
          <div className="lg:col-span-2">
            <Card className="glass p-6">
              <div className="flex items-center gap-2 mb-6">
                <Dna className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">DNA Sequence Selection</h2>
                <Badge variant="outline" className="ml-auto">
                  Total: {totalPercentage}%
                </Badge>
              </div>

              <Tabs defaultValue="species" className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 sm:mb-6 h-auto">
                  <TabsTrigger value="species" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Species DNA</span>
                    <span className="sm:hidden">Species</span>
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Coloration</span>
                    <span className="sm:hidden">Colors</span>
                  </TabsTrigger>
                  <TabsTrigger value="patterns" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    Patterns
                  </TabsTrigger>
                  <TabsTrigger value="size" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Size & Age</span>
                    <span className="sm:hidden">Size</span>
                  </TabsTrigger>
                  <TabsTrigger value="science" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    Science
                  </TabsTrigger>
                  <TabsTrigger value="generation" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <span className="hidden sm:inline">Generation</span>
                    <span className="sm:hidden">Gen</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="species" className="space-y-4">
                  <AddSpeciesSelector 
                    availableSpecies={dinosaurs}
                    onAddSpecies={addSpecies}
                  />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {dinosaurs.map((dinosaur) => (
                      <div key={dinosaur.id} className="relative">
                        <DinosaurCard
                          {...dinosaur}
                          onPercentageChange={(value) => updatePercentage(dinosaur.id, value)}
                          isSelected={dinosaur.percentage > 0}
                          onSelect={() => {}}
                          traitSelections={traitSelections[dinosaur.id]}
                          onTraitSelectionChange={(trait, state) => updateTraitSelection(dinosaur.id, trait, state)}
                          dinosaurId={dinosaur.id}
                          allDinosaurs={dinosaurs}
                          allTraitSelections={traitSelections}
                        />
                        {dinosaurs.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2 w-6 h-6 p-0 bg-destructive/20 border-destructive/50 hover:bg-destructive/30"
                            onClick={() => removeSpecies(dinosaur.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button onClick={normalizePercentages} variant="outline" className="btn-lab w-full sm:w-auto">
                      Normalize to 100%
                    </Button>
                    <Button 
                      onClick={randomizeAll} 
                      variant="outline" 
                      className="btn-lab flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Shuffle className="w-4 h-4" />
                      Randomize
                    </Button>
                    <Button 
                      onClick={() => generateHybrid()}
                      disabled={totalPercentage === 0 || hookIsGenerating}
                      className="btn-genetic flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Zap className="w-4 h-4" />
                      {hookIsGenerating ? "Engineering..." : "Generate Hybrid"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="colors">
                  <ColorPalette
                    selectedColors={selectedColors}
                    onColorsChange={setSelectedColors}
                    colorEffects={colorEffects}
                    onColorEffectsChange={setColorEffects}
                  />
                </TabsContent>

                <TabsContent value="patterns">
                  <PatternSelector
                    selectedPattern={selectedPattern}
                    onPatternChange={setSelectedPattern}
                    selectedTexture={selectedTexture}
                    onTextureChange={setSelectedTexture}
                  />
                </TabsContent>

                <TabsContent value="size">
                  <div className="space-y-6">
                    <SizeScaler
                      size={creatureSize}
                      onSizeChange={setCreatureSize}
                    />
                    <AgeVariation
                      ageStage={ageStage}
                      onAgeStageChange={setAgeStage}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="science">
                  {scientificProfile ? (
                    <ScientificProfile
                      behavioralProfile={scientificProfile.behavioralProfile}
                      scientificName={scientificProfile.scientificName}
                    />
                  ) : (
                    <Card className="glass p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Beaker className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Scientific Analysis</h3>
                      </div>
                      <div className="text-center py-8">
                        <div className="text-4xl text-muted-foreground/50 mb-4">🧬</div>
                        <p className="text-muted-foreground">
                          Configure DNA percentages to generate scientific profile
                        </p>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="advanced">
                  <Card className="glass p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Beaker className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Advanced Genetics</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-6">
                      Advanced genetic modifications and experimental features.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-accent">Current Configuration</h4>
                        <div className="bg-secondary/20 rounded-lg p-3 space-y-1">
                          <div className="text-sm"><strong>Size:</strong> {creatureSize}% scale</div>
                          <div className="text-sm"><strong>Age:</strong> {ageStage}</div>
                          <div className="text-sm"><strong>Colors:</strong> {selectedColors.length}/3</div>
                          <div className="text-sm"><strong>Effects:</strong> {colorEffects.length}/2</div>
                          <div className="text-sm"><strong>Pattern:</strong> {selectedPattern}</div>
                          <div className="text-sm"><strong>Texture:</strong> {selectedTexture}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-accent">Genetic Stability</h4>
                        <div className="bg-secondary/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium">Stable</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Current genetic combination is viable for hybrid creation.
                          </p>
                        </div>
                      </div>
                      
                      {scientificProfile && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-accent">Scientific Name</h4>
                          <div className="bg-secondary/20 rounded-lg p-3">
                            <p className="font-medium italic text-primary text-sm">
                              {scientificProfile.scientificName.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Temperament: {scientificProfile.behavioralProfile.temperament}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Intelligence: {scientificProfile.behavioralProfile.intelligence}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Debug Panel - only show in development */}
                    {import.meta.env.DEV && (
                      <div className="mt-6 pt-4 border-t border-destructive/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Settings className="w-4 h-4 text-destructive" />
                          <h4 className="text-sm font-semibold text-destructive">Debug Tools</h4>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const { GenerationDiagnostics } = await import("@/services/diagnostics");
                              GenerationDiagnostics.runFullDiagnostics();
                            }}
                          >
                            Run Diagnostics
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const { GenerationDiagnostics } = await import("@/services/diagnostics");
                              GenerationDiagnostics.testApiConnection();
                            }}
                          >
                            Test API
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log('🧬 Current state:', {
                                dinosaurs,
                                selectedColors,
                                traitSelections,
                                scientificProfile,
                                isGenerating: hookIsGenerating,
                                generatedImage
                              });
                            }}
                          >
                            Log State
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Check browser console for detailed output
                        </p>
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="sticky top-4">
              {hookIsGenerating && loadingStage ? (
                <AdvancedLoading 
                  stage={loadingStage}
                  progress={loadingProgress}
                  subtext="Creating your genetic masterpiece..."
                />
              ) : (
                <ResultsDisplay 
                  dinosaurs={dinosaurs}
                  isGenerating={hookIsGenerating}
                  generatedImage={generatedImage}
                  selectedColors={selectedColors}
                  selectedPattern={selectedPattern}
                  selectedBackground={selectedBackground}
                  onBackgroundChange={setSelectedBackground}
                  colorEffects={colorEffects}
                  selectedTexture={selectedTexture}
                  creatureSize={creatureSize}
                  ageStage={ageStage}
                  traitSelections={traitSelections}
                  scientificProfile={scientificProfile}
                  onRetry={generateHybrid}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Gallery Dialog */}
      <Dialog open={isCommunityGalleryOpen} onOpenChange={setIsCommunityGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Community Gallery
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[75vh]">
            <CommunityGallery onCreatureInspire={handleCreatureInspire} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog - Only for authenticated users */}
      {user && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings & API Keys
              </DialogTitle>
            </DialogHeader>
            <SettingsComponent onApiKeyChange={() => window.location.reload()} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};