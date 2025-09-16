import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Zap, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPaletteProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  colorEffects: string[];
  onColorEffectsChange: (effects: string[]) => void;
}

const standardColors = [
  "#00ffff", "#00ff00", "#ff6b00", "#ff0000", "#8b00ff", 
  "#ffff00", "#ff69b4", "#00bfff", "#32cd32", "#ff4500",
  "#9400d3", "#ffd700", "#dc143c", "#00ced1", "#adff2f"
];

const metallicColors = [
  { color: "#C0C0C0", name: "Silver", effect: "metallic" },
  { color: "#FFD700", name: "Gold", effect: "metallic" },
  { color: "#B87333", name: "Bronze", effect: "metallic" },
  { color: "#E5E4E2", name: "Platinum", effect: "metallic" },
  { color: "#CD7F32", name: "Copper", effect: "metallic" }
];

const iridescent = [
  { color: "#FF1493", name: "Magenta Shift", effect: "iridescent" },
  { color: "#00CED1", name: "Cyan Shift", effect: "iridescent" },
  { color: "#9370DB", name: "Purple Shift", effect: "iridescent" },
  { color: "#20B2AA", name: "Teal Shift", effect: "iridescent" },
  { color: "#FF69B4", name: "Pink Shift", effect: "iridescent" }
];

const bioluminescent = [
  { color: "#00FFFF", name: "Electric Blue", effect: "bioluminescent" },
  { color: "#00FF00", name: "Toxic Green", effect: "bioluminescent" },
  { color: "#FF00FF", name: "Neon Purple", effect: "bioluminescent" },
  { color: "#FFFF00", name: "Lightning Yellow", effect: "bioluminescent" },
  { color: "#FF6600", name: "Fire Orange", effect: "bioluminescent" }
];

const colorEffectOptions = [
  { id: "standard", name: "Standard", icon: Palette, description: "Natural pigmentation" },
  { id: "metallic", name: "Metallic", icon: Gem, description: "Reflective metallic sheen" },
  { id: "iridescent", name: "Iridescent", icon: Sparkles, description: "Color-shifting properties" },
  { id: "bioluminescent", name: "Bioluminescent", icon: Zap, description: "Glowing in the dark" }
];

export const ColorPalette = ({ selectedColors, onColorsChange, colorEffects, onColorEffectsChange }: ColorPaletteProps) => {
  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color));
    } else if (selectedColors.length < 3) {
      onColorsChange([...selectedColors, color]);
    }
  };

  const toggleEffect = (effect: string) => {
    if (colorEffects.includes(effect)) {
      onColorEffectsChange(colorEffects.filter(e => e !== effect));
    } else if (colorEffects.length < 2) {
      onColorEffectsChange([...colorEffects, effect]);
    }
  };

  const renderColorGrid = (colors: any[], isSpecial = false) => (
    <div className="grid grid-cols-5 gap-3">
      {colors.map((item, index) => {
        const color = isSpecial ? item.color : item;
        const name = isSpecial ? item.name : color;
        
        return (
          <div key={index} className="flex flex-col items-center gap-1">
            <Button
              variant="outline"
              className={cn(
                "w-12 h-12 p-0 border-2 hover-glow relative",
                selectedColors.includes(color) 
                  ? "ring-2 ring-primary glow-primary" 
                  : "border-border",
                isSpecial && item.effect === "metallic" && "shadow-lg",
                isSpecial && item.effect === "iridescent" && "animate-pulse",
                isSpecial && item.effect === "bioluminescent" && "shadow-[0_0_10px_currentColor]"
              )}
              style={{ backgroundColor: color }}
              onClick={() => toggleColor(color)}
            >
              {isSpecial && (
                <div className="absolute inset-0 rounded bg-gradient-to-br from-white/20 to-transparent" />
              )}
            </Button>
            {isSpecial && (
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Advanced Coloration</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Select up to 3 colors and 2 special effects for your hybrid's appearance.
      </p>

      <Tabs defaultValue="standard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {colorEffectOptions.map((option) => (
            <TabsTrigger key={option.id} value={option.id} className="text-xs">
              <option.icon className="w-3 h-3 mr-1" />
              {option.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="standard" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Standard Colors</h4>
            <p className="text-xs text-muted-foreground">Natural dinosaur pigmentation</p>
          </div>
          {renderColorGrid(standardColors)}
        </TabsContent>

        <TabsContent value="metallic" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Gem className="w-4 h-4" />
              Metallic Colors
            </h4>
            <p className="text-xs text-muted-foreground">Reflective, armor-like appearance</p>
          </div>
          {renderColorGrid(metallicColors, true)}
        </TabsContent>

        <TabsContent value="iridescent" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Iridescent Colors
            </h4>
            <p className="text-xs text-muted-foreground">Color-shifting, oil-slick effects</p>
          </div>
          {renderColorGrid(iridescent, true)}
        </TabsContent>

        <TabsContent value="bioluminescent" className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Bioluminescent Colors
            </h4>
            <p className="text-xs text-muted-foreground">Glowing, light-emitting effects</p>
          </div>
          {renderColorGrid(bioluminescent, true)}
        </TabsContent>
      </Tabs>

      {/* Color Effects Selection */}
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Active Color Effects</h4>
          <p className="text-xs text-muted-foreground">Select up to 2 special effects</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {colorEffectOptions.slice(1).map((effect) => {
            const IconComponent = effect.icon;
            return (
              <Button
                key={effect.id}
                variant="outline"
                size="sm"
                className={cn(
                  "flex items-center gap-2 h-auto p-3",
                  colorEffects.includes(effect.id) && "ring-2 ring-primary bg-primary/10"
                )}
                onClick={() => toggleEffect(effect.id)}
              >
                <IconComponent className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">{effect.name}</div>
                  <div className="text-xs text-muted-foreground">{effect.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Selected Colors Display */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-medium">Selected Colors & Effects:</h4>
        <div className="flex flex-wrap gap-2">
          {selectedColors.map((color, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full"
            >
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">{color}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={() => toggleColor(color)}
              >
                ×
              </Button>
            </div>
          ))}
          {colorEffects.map((effect, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="flex items-center gap-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => toggleEffect(effect)}
            >
              {colorEffectOptions.find(opt => opt.id === effect)?.icon && 
                React.createElement(colorEffectOptions.find(opt => opt.id === effect)!.icon, { className: "w-3 h-3" })
              }
              {effect}
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};