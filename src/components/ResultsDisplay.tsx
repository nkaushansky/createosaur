import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, RotateCcw, Loader2, Globe, Heart } from "lucide-react";
import { BackgroundSelector, backgroundOptions } from '@/components/BackgroundSelector';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatures } from "@/hooks/useCreatures";

interface DinosaurData {
  id: string;
  name: string;
  percentage: number;
}

interface ResultsDisplayProps {
  dinosaurs: DinosaurData[];
  isGenerating: boolean;
  generatedImage: string | null;
  selectedColors: string[];
  selectedPattern: string;
  selectedBackground: string;
  onBackgroundChange: (backgroundId: string) => void;
  colorEffects?: string[];
  selectedTexture?: string;
  creatureSize?: number;
  ageStage?: 'juvenile' | 'adult';
  traitSelections?: any;
  scientificProfile?: any;
  onRetry?: () => void;
}

export const ResultsDisplay = ({
  dinosaurs,
  isGenerating,
  generatedImage,
  selectedColors,
  selectedPattern,
  selectedBackground,
  onBackgroundChange,
  colorEffects = [],
  selectedTexture = "scales",
  creatureSize = 50,
  ageStage = "adult",
  traitSelections = {},
  scientificProfile,
  onRetry
}: ResultsDisplayProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { saveCreature } = useCreatures();
  const activeDinosaurs = dinosaurs.filter(d => d.percentage > 0);
  const totalPercentage = dinosaurs.reduce((sum, dino) => sum + dino.percentage, 0);
  const backgroundOption = backgroundOptions.find(bg => bg.id === selectedBackground);

  // Handler for saving the generated image
  const handleSaveImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `hybrid-creature-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Image Saved!",
        description: "Your hybrid creature has been downloaded to your computer.",
      });
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handler for sharing the generated image
  const handleShareImage = async (imageUrl: string) => {
    try {
      if (navigator.share && navigator.canShare) {
        // Try native sharing if available
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'hybrid-creature.jpg', { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Hybrid Creature',
            text: 'Check out this amazing hybrid creature I created with Createosaur!',
            files: [file]
          });
        } else {
          // Fallback to URL sharing
          await navigator.share({
            title: 'My Hybrid Creature',
            text: 'Check out this amazing hybrid creature I created with Createosaur!',
            url: window.location.href
          });
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Share link copied to clipboard. The image can be saved manually.",
        });
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Share link copied to clipboard as fallback.",
        });
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Could not share the image. Please save and share manually.",
          variant: "destructive"
        });
      }
    }
  };

  const handleShareToCommunity = async (imageUrl: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to share creatures with the community.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate creature name
      const hybridName = activeDinosaurs.length > 0 
        ? `${activeDinosaurs.map(d => d.name.split(' ')[0]).join('-')} Hybrid`
        : 'Mystery Hybrid';

      // Prepare creature data
      const creatureData = {
        name: hybridName,
        image_url: imageUrl,
        generation_params: {
          dinosaurs: activeDinosaurs,
          selectedColors,
          selectedPattern,
          colorEffects,
          selectedTexture,
          creatureSize,
          ageStage,
          traitSelections,
          selectedBackground,
          scientificProfile
        },
        traits: {
          species: activeDinosaurs.map(d => d.name),
          colors: selectedColors,
          pattern: selectedPattern,
          texture: selectedTexture,
          size: sizeLabel,
          age: ageStage,
          effects: colorEffects
        },
        is_public: true, // This makes it visible in the community gallery
        is_favorite: false
      };

      const savedCreature = await saveCreature(creatureData);
      
      if (savedCreature) {
        toast({
          title: "Shared to Community! 🌟",
          description: `"${hybridName}" is now visible in the community gallery for everyone to discover and get inspired by!`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Failed to share to community:', error);
      toast({
        title: "Share Failed",
        description: "Could not share to community. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Enhanced customization display
  const sizeLabel = creatureSize < 25 ? "Tiny" : creatureSize < 50 ? "Small" : creatureSize < 75 ? "Medium" : "Massive";
  const effectsText = colorEffects.length > 0 ? ` (${colorEffects.join(", ")})` : "";

  return (
    <div className="space-y-6">
      {/* Genetic Composition */}
      <Card className="glass p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Genetic Composition</h3>
        
        {activeDinosaurs.length > 0 ? (
          <div className="space-y-3">
            {activeDinosaurs
              .sort((a, b) => b.percentage - a.percentage)
              .map((dino) => (
                <div key={dino.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{dino.name}</span>
                    <span className="text-primary">{dino.percentage}%</span>
                  </div>
                  <Progress 
                    value={dino.percentage} 
                    className="h-2 bg-muted"
                  />
                </div>
              ))}
            
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total DNA:</span>
                <Badge variant={totalPercentage === 100 ? "default" : "destructive"}>
                  {totalPercentage}%
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            No DNA sequences selected
          </p>
        )}
      </Card>

      {/* Generation Preview */}
      <Card className="glass p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Hybrid Preview</h3>
          <BackgroundSelector 
            selectedBackground={selectedBackground}
            onBackgroundChange={onBackgroundChange}
          />
        </div>
        
        <div 
          className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center mb-4"
          style={{
            background: backgroundOption?.gradient || 'hsl(var(--muted) / 0.2)',
          }}
        >
          {isGenerating ? (
            <div className="text-center space-y-3 relative z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto drop-shadow-lg" />
              <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Engineering hybrid...</p>
                <div className="w-32 bg-muted rounded-full h-2 mx-auto mt-2">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          ) : generatedImage ? (
            <div className="relative w-full h-full flex flex-col">
              {/* Image Container - takes up most of the space */}
              <div className="flex-1 rounded-lg overflow-hidden relative">
                <img 
                  src={generatedImage} 
                  alt="Generated hybrid creature" 
                  className="w-full h-full object-contain bg-gradient-to-br from-primary/10 to-accent/10"
                  onError={(e) => {
                    console.error('Failed to load generated image:', generatedImage);
                    e.currentTarget.src = 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#374151"/>
                        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial" font-size="16">
                          Image Load Failed
                        </text>
                      </svg>
                    `);
                  }}
                />
                
                {/* Overlay label at top */}
                <div className="absolute top-2 left-2 right-2">
                  <span className="text-xs text-white/80 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                    Generated Hybrid Creature
                  </span>
                </div>
              </div>
              
              {/* Action Buttons - compact and positioned at bottom */}
              <div className="flex gap-2 justify-center pt-3 pb-1 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="btn-lab bg-background/95 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                  onClick={() => handleSaveImage(generatedImage)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="btn-lab bg-background/95 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                  onClick={() => handleShareImage(generatedImage)}
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  Share
                </Button>
                {user && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="btn-lab bg-background/95 backdrop-blur-sm border-green-500/20 hover:bg-green-500/10 text-green-700 dark:text-green-400"
                    onClick={() => handleShareToCommunity(generatedImage)}
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Community</span>
                    <span className="sm:hidden">Public</span>
                  </Button>
                )}
                {onRetry && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="btn-lab bg-background/95 backdrop-blur-sm border-primary/20 hover:bg-primary/10" 
                    onClick={onRetry}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 relative z-10">
              <div className="text-4xl text-muted-foreground/50 drop-shadow-lg">🧬</div>
              <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Configure DNA and generate
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Phenotype Summary */}
        {activeDinosaurs.length > 0 && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-accent">Size: </span>
                  <span className="text-foreground">{sizeLabel} ({creatureSize}%)</span>
                </div>
                <div>
                  <span className="font-medium text-accent">Age: </span>
                  <span className="text-foreground capitalize">{ageStage}</span>
                </div>
                <div>
                  <span className="font-medium text-accent">Texture: </span>
                  <span className="text-foreground capitalize">{selectedTexture}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-accent">Pattern: </span>
                  <span className="capitalize text-foreground">{selectedPattern}</span>
                </div>
                <div>
                  <span className="font-medium text-accent">Colors: </span>
                  <span className="text-foreground">{selectedColors.length}{effectsText}</span>
                </div>
                <div>
                  <span className="font-medium text-accent">Stability: </span>
                  <span className="text-green-500">Viable</span>
                </div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-accent">Color Palette: </span>
              <div className="flex gap-1 mt-1">
                {selectedColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-accent">Dominant Species: </span>
              <span className="text-foreground">
                {activeDinosaurs[0]?.name || "None"}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};