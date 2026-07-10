import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { AdvancedTraitSelector } from "./AdvancedTraitSelector";

export type TraitState = "default" | "included" | "excluded";

export interface TraitSelection {
  [trait: string]: TraitState;
}

interface DinosaurCardProps {
  name: string;
  scientificName: string;
  period: string;
  traits: string[];
  percentage: number;
  onPercentageChange: (value: number) => void;
  isSelected: boolean;
  onSelect: () => void;
  traitSelections?: TraitSelection;
  onTraitSelectionChange?: (trait: string, state: TraitState) => void;
  dinosaurId: string;
  allDinosaurs: Array<{ id: string; traits: string[] }>;
  allTraitSelections: { [dinosaurId: string]: TraitSelection };
}

export const DinosaurCard = ({
  name,
  scientificName,
  period,
  traits,
  percentage,
  onPercentageChange,
  isSelected,
  onSelect,
  traitSelections = {},
  onTraitSelectionChange,
  dinosaurId,
  allDinosaurs,
  allTraitSelections,
}: DinosaurCardProps) => {
  
  const handleTraitClick = (trait: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTraitSelectionChange) return;
    
    const currentState = traitSelections[trait] || "default";
    const nextState: TraitState = 
      currentState === "default" ? "included" :
      currentState === "included" ? "excluded" : "default";
    
    onTraitSelectionChange(trait, nextState);
  };

  const getTraitStyles = (trait: string) => {
    const state = traitSelections[trait] || "default";
    switch (state) {
      case "included":
        return "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300";
      case "excluded":
        return "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300";
      default:
        return "bg-secondary/50 border-border text-foreground hover:bg-secondary/70";
    }
  };

  const getTraitIcon = (trait: string) => {
    const state = traitSelections[trait] || "default";
    switch (state) {
      case "included":
        return <Check className="w-3 h-3" />;
      case "excluded":
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };
  return (
    <Card
      className={cn(
        "glass hover-glow cursor-pointer transition-all duration-300 p-4",
        isSelected && "ring-2 ring-primary glow-primary"
      )}
      onClick={onSelect}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">{name}</h3>
            <p className="text-sm text-muted-foreground italic">{scientificName}</p>
            <p className="text-xs text-primary">{period}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary min-w-[3rem] text-right">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Prominent slider */}
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-accent">DNA Percentage</label>
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percentage}
            onChange={(e) => onPercentageChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,255,0.5)]
                     [&::-webkit-slider-track]:bg-muted [&::-webkit-slider-track]:rounded-lg
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-accent">Genetic Traits:</h4>
          <p className="text-xs text-muted-foreground">Advanced trait selection available in expanded view</p>
          <div className="flex flex-wrap gap-1">
            {traits.slice(0, 4).map((trait, index) => (
              <button
                key={index}
                onClick={(e) => handleTraitClick(trait, e)}
                className={cn(
                  "px-2 py-1 text-xs border rounded-full transition-all duration-200 flex items-center gap-1",
                  getTraitStyles(trait),
                  onTraitSelectionChange && "cursor-pointer hover:scale-105"
                )}
                disabled={!onTraitSelectionChange}
              >
                {getTraitIcon(trait)}
                {trait}
              </button>
            ))}
            {traits.length > 4 && (
              <span className="px-2 py-1 text-xs text-muted-foreground border border-dashed rounded-full">
                +{traits.length - 4} more
              </span>
            )}
          </div>
          
          {onTraitSelectionChange && (
            <AdvancedTraitSelector
              dinosaurName={name}
              traits={traits}
              traitSelections={traitSelections}
              onTraitSelectionChange={onTraitSelectionChange}
              dinosaurId={dinosaurId}
              allDinosaurs={allDinosaurs}
              allTraitSelections={allTraitSelections}
            />
          )}
        </div>
      </div>
    </Card>
  );
};