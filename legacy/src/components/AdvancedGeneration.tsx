import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Shuffle, 
  Layers, 
  Lightbulb, 
  Dice6, 
  Copy,
  Download,
  Settings
} from "lucide-react";

interface GenerationAlgorithm {
  id: string;
  name: string;
  description: string;
  complexity: "basic" | "advanced" | "experimental";
}

const algorithms: GenerationAlgorithm[] = [
  {
    id: "genetic",
    name: "Genetic Fusion",
    description: "Combines DNA sequences using percentage-based mixing",
    complexity: "basic"
  },
  {
    id: "evolutionary",
    name: "Evolutionary Algorithm",
    description: "Uses mutation and selection to evolve creatures",
    complexity: "advanced"
  },
  {
    id: "neural",
    name: "Neural Synthesis",
    description: "AI-driven feature combination and enhancement",
    complexity: "experimental"
  },
  {
    id: "chaos",
    name: "Chaos Theory",
    description: "Introduces controlled randomness for unique results",
    complexity: "experimental"
  }
];

interface AdvancedGenerationProps {
  dinosaurs: Array<{ id: string; name: string; percentage: number; traits: string[] }>;
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
}

export interface GenerationParams {
  algorithm: string;
  batchSize: number;
  promptText?: string;
  randomSeed?: number;
  mutationRate?: number;
  complexityLevel?: number;
  useRandomElements: boolean;
  preserveTraits: string[];
  // AI generation parameters
  steps?: number;
  guidance?: number;
  width?: number;
  height?: number;
}

export const AdvancedGeneration = ({ dinosaurs, onGenerate, isGenerating }: AdvancedGenerationProps) => {
  const { toast } = useToast();
  
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("genetic");
  const [batchSize, setBatchSize] = useState(1);
  const [promptText, setPromptText] = useState("");
  const [randomSeed, setRandomSeed] = useState<number | undefined>();
  const [mutationRate, setMutationRate] = useState([0.1]);
  const [complexityLevel, setComplexityLevel] = useState([50]);
  const [useRandomElements, setUseRandomElements] = useState(false);
  const [preserveTraits, setPreserveTraits] = useState<string[]>([]);

  const availableTraits = dinosaurs.flatMap(d => d.traits).filter((trait, index, self) => 
    self.indexOf(trait) === index
  );

  const selectedAlgorithmData = algorithms.find(a => a.id === selectedAlgorithm);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "basic": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "advanced": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "experimental": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted";
    }
  };

  const handleGenerateRandom = useCallback(() => {
    setRandomSeed(Math.floor(Math.random() * 1000000));
    toast({
      title: "Random Seed Generated",
      description: `New seed: ${randomSeed}`,
    });
  }, [randomSeed, toast]);

  const handleBatchGenerate = useCallback(() => {
    const params: GenerationParams = {
      algorithm: selectedAlgorithm,
      batchSize,
      promptText: promptText || undefined,
      randomSeed,
      mutationRate: mutationRate[0],
      complexityLevel: complexityLevel[0],
      useRandomElements,
      preserveTraits,
    };

    onGenerate(params);
    
    toast({
      title: "Generation Started",
      description: `Creating ${batchSize} creature${batchSize > 1 ? 's' : ''} using ${selectedAlgorithmData?.name}`,
    });
  }, [
    selectedAlgorithm,
    batchSize,
    promptText,
    randomSeed,
    mutationRate,
    complexityLevel,
    useRandomElements,
    preserveTraits,
    onGenerate,
    selectedAlgorithmData,
    toast
  ]);

  const handleQuickPreset = useCallback((preset: string) => {
    switch (preset) {
      case "random":
        setSelectedAlgorithm("chaos");
        setBatchSize(3);
        setUseRandomElements(true);
        setMutationRate([0.3]);
        break;
      case "evolution":
        setSelectedAlgorithm("evolutionary");
        setBatchSize(5);
        setMutationRate([0.15]);
        setComplexityLevel([75]);
        break;
      case "artistic":
        setSelectedAlgorithm("neural");
        setBatchSize(2);
        setComplexityLevel([80]);
        setUseRandomElements(true);
        break;
      case "scientific":
        setSelectedAlgorithm("genetic");
        setBatchSize(1);
        setMutationRate([0.05]);
        setComplexityLevel([90]);
        break;
    }
    
    toast({
      title: "Preset Applied",
      description: `Applied ${preset} generation settings`,
    });
  }, [toast]);

  const togglePreserveTrait = (trait: string) => {
    setPreserveTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Advanced Generation</h3>
      </div>

      <div className="space-y-6">
        {/* Quick Presets */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickPreset("random")}
              className="btn-lab"
            >
              <Dice6 className="w-3 h-3 mr-1" />
              Random
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickPreset("evolution")}
              className="btn-lab"
            >
              <Shuffle className="w-3 h-3 mr-1" />
              Evolution
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickPreset("artistic")}
              className="btn-lab"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Artistic
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickPreset("scientific")}
              className="btn-lab"
            >
              <Zap className="w-3 h-3 mr-1" />
              Scientific
            </Button>
          </div>
        </div>

        <Separator />

        {/* Algorithm Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Generation Algorithm</Label>
          <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {algorithms.map(algo => (
                <SelectItem key={algo.id} value={algo.id}>
                  <div className="flex items-center gap-2">
                    <span>{algo.name}</span>
                    <Badge className={getComplexityColor(algo.complexity)}>
                      {algo.complexity}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAlgorithmData && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedAlgorithmData.description}
            </p>
          )}
        </div>

        {/* Batch Generation */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Batch Generation</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Slider
                value={[batchSize]}
                onValueChange={(value) => setBatchSize(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium min-w-[2rem]">{batchSize}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Generate multiple variations at once
          </p>
        </div>

        {/* Text Prompt */}
        <div>
          <Label htmlFor="prompt" className="text-sm font-medium mb-3 block">
            Custom Description (Optional)
          </Label>
          <Textarea
            id="prompt"
            placeholder="Describe the creature you want to create..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
          />
        </div>

        {/* Advanced Parameters */}
        {(selectedAlgorithm === "evolutionary" || selectedAlgorithm === "neural") && (
          <div className="space-y-4">
            <Label className="text-sm font-medium block">Advanced Parameters</Label>
            
            {/* Mutation Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Mutation Rate</Label>
                <span className="text-xs text-muted-foreground">{(mutationRate[0] * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={mutationRate}
                onValueChange={setMutationRate}
                min={0.01}
                max={0.5}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Complexity Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Complexity Level</Label>
                <span className="text-xs text-muted-foreground">{complexityLevel[0]}%</span>
              </div>
              <Slider
                value={complexityLevel}
                onValueChange={setComplexityLevel}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Random Elements */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Random Elements</Label>
            <p className="text-xs text-muted-foreground">Add unexpected features</p>
          </div>
          <Switch
            checked={useRandomElements}
            onCheckedChange={setUseRandomElements}
          />
        </div>

        {/* Random Seed */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Random Seed (Optional)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Leave empty for random"
              value={randomSeed || ""}
              onChange={(e) => setRandomSeed(e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Button size="sm" variant="outline" onClick={handleGenerateRandom}>
              <Dice6 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preserve Traits */}
        {availableTraits.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Preserve Traits</Label>
            <div className="flex gap-2 flex-wrap">
              {availableTraits.map(trait => (
                <Button
                  key={trait}
                  size="sm"
                  variant={preserveTraits.includes(trait) ? "default" : "outline"}
                  onClick={() => togglePreserveTrait(trait)}
                  className="text-xs"
                >
                  {trait}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Generate Button */}
        <Button 
          onClick={handleBatchGenerate}
          disabled={isGenerating || dinosaurs.filter(d => d.percentage > 0).length === 0}
          className="w-full btn-genetic"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isGenerating 
            ? "Generating..." 
            : `Generate ${batchSize} Creature${batchSize > 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </Card>
  );
};