import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Dna } from "lucide-react";
import { TraitCategoryTabs } from "./TraitCategoryTabs";
import { TraitSelection } from "./DinosaurCard";

interface AdvancedTraitSelectorProps {
  dinosaurName: string;
  traits: string[];
  traitSelections: TraitSelection;
  onTraitSelectionChange: (trait: string, state: any) => void;
  dinosaurId: string;
  allDinosaurs: Array<{ id: string; traits: string[] }>;
  allTraitSelections: { [dinosaurId: string]: TraitSelection };
}

export const AdvancedTraitSelector = ({
  dinosaurName,
  traits,
  traitSelections,
  onTraitSelectionChange,
  dinosaurId,
  allDinosaurs,
  allTraitSelections
}: AdvancedTraitSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCount = Object.values(traitSelections || {}).filter(state => state === 'included').length;
  const excludedCount = Object.values(traitSelections || {}).filter(state => state === 'excluded').length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 h-8 text-xs flex items-center gap-2 hover:bg-primary/10"
        >
          <Settings className="w-3 h-3" />
          Advanced Traits
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs h-4 px-1">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-primary" />
            {dinosaurName} - Advanced Trait Selection
          </DialogTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Traits: {traits.length}</span>
            <span className="text-green-600">Included: {selectedCount}</span>
            <span className="text-red-600">Excluded: {excludedCount}</span>
          </div>
        </DialogHeader>
        
        <Card className="p-4">
          <TraitCategoryTabs
            traits={traits}
            traitSelections={traitSelections || {}}
            onTraitSelectionChange={onTraitSelectionChange}
            dinosaurId={dinosaurId}
            allDinosaurs={allDinosaurs}
            allTraitSelections={allTraitSelections}
          />
        </Card>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              // Clear all selections for this dinosaur
              traits.forEach(trait => onTraitSelectionChange(trait, 'default'));
            }}
          >
            Clear All
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};