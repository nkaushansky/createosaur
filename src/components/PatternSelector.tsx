import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Grid3X3, Waves, Zap, Feather, Shield, TreePine } from "lucide-react";

interface PatternSelectorProps {
  selectedPattern: string;
  onPatternChange: (pattern: string) => void;
  selectedTexture: string;
  onTextureChange: (texture: string) => void;
}

const patterns = [
  { id: "stripes", name: "Stripes", icon: Grid3X3, description: "Tiger-like striped patterns" },
  { id: "spots", name: "Spots", icon: Grid3X3, description: "Leopard-style spotted markings" },
  { id: "scales", name: "Scales", icon: Waves, description: "Reptilian scale textures" },
  { id: "solid", name: "Solid", icon: Zap, description: "Uniform coloration" },
  { id: "gradient", name: "Gradient", icon: Waves, description: "Smooth color transitions" },
  { id: "camouflage", name: "Camouflage", icon: Grid3X3, description: "Natural camouflage patterns" },
  { id: "rosettes", name: "Rosettes", icon: Grid3X3, description: "Jaguar-style rosette patterns" },
  { id: "mottled", name: "Mottled", icon: Waves, description: "Irregular blotchy patterns" }
];

const textures = [
  { id: "smooth", name: "Smooth Skin", icon: Waves, description: "Amphibian-like smooth surface", category: "skin" },
  { id: "scales", name: "Reptilian Scales", icon: Shield, description: "Overlapping protective scales", category: "skin" },
  { id: "plates", name: "Bony Plates", icon: Shield, description: "Armored plating", category: "skin" },
  { id: "feathers", name: "Feathers", icon: Feather, description: "Bird-like feathered covering", category: "covering" },
  { id: "fur", name: "Fur/Hair", icon: TreePine, description: "Mammalian fur coating", category: "covering" },
  { id: "quills", name: "Quills", icon: Feather, description: "Defensive spine-like quills", category: "covering" },
  { id: "leather", name: "Leathery Hide", icon: Shield, description: "Thick, tough skin", category: "skin" },
  { id: "crystalline", name: "Crystalline", icon: Zap, description: "Crystal-like formations", category: "special" }
];

const textureCategories = [
  { id: "skin", name: "Skin Types", description: "Base skin textures" },
  { id: "covering", name: "Body Covering", description: "External coverings" },
  { id: "special", name: "Special Materials", description: "Unique textures" }
];

export const PatternSelector = ({ selectedPattern, onPatternChange, selectedTexture, onTextureChange }: PatternSelectorProps) => {
  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Pattern & Texture Genetics</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Choose the surface patterns and textures for your hybrid's phenotype.
      </p>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patterns">Color Patterns</TabsTrigger>
          <TabsTrigger value="textures">Surface Textures</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Pattern Selection</h4>
            <p className="text-xs text-muted-foreground">How colors are distributed across the body</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {patterns.map((pattern) => {
              const IconComponent = pattern.icon;
              return (
                <Button
                  key={pattern.id}
                  variant="outline"
                  className={cn(
                    "flex flex-col items-center gap-2 h-auto p-4 btn-lab",
                    selectedPattern === pattern.id && "ring-2 ring-primary glow-primary bg-primary/10"
                  )}
                  onClick={() => onPatternChange(pattern.id)}
                >
                  <IconComponent className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">{pattern.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="textures" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Texture Selection</h4>
            <p className="text-xs text-muted-foreground">Physical surface properties and materials</p>
          </div>

          <div className="space-y-6">
            {textureCategories.map((category) => {
              const categoryTextures = textures.filter(t => t.category === category.id);
              
              return (
                <div key={category.id} className="space-y-3">
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-accent">{category.name}</h5>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {categoryTextures.map((texture) => {
                      const IconComponent = texture.icon;
                      return (
                        <Button
                          key={texture.id}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "flex items-center gap-2 h-auto p-3 text-left",
                            selectedTexture === texture.id && "ring-2 ring-primary glow-primary bg-primary/10"
                          )}
                          onClick={() => onTextureChange(texture.id)}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{texture.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{texture.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};