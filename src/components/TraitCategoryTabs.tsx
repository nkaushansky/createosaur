import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TraitSelection, TraitState } from "./DinosaurCard";
import { TRAIT_CATEGORIES, TraitCategory } from "@/types/traits";
import { useTraitSystem } from "@/hooks/useTraitSystem";

interface TraitCategoryTabsProps {
  traits: string[];
  traitSelections: TraitSelection;
  onTraitSelectionChange: (trait: string, state: TraitState) => void;
  dinosaurId: string;
  allDinosaurs: Array<{ id: string; traits: string[] }>;
  allTraitSelections: { [dinosaurId: string]: TraitSelection };
}

export const TraitCategoryTabs = ({
  traits,
  traitSelections,
  onTraitSelectionChange,
  dinosaurId,
  allDinosaurs,
  allTraitSelections
}: TraitCategoryTabsProps) => {
  const { 
    conflicts, 
    suggestions, 
    getTraitsByCategory, 
    getTraitDefinition 
  } = useTraitSystem(allTraitSelections, allDinosaurs);
  
  const categorizedTraits = getTraitsByCategory(traits);
  
  const handleTraitClick = (trait: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentState = traitSelections[trait] || "default";
    const nextState: TraitState = 
      currentState === "default" ? "included" :
      currentState === "included" ? "excluded" : "default";
    
    onTraitSelectionChange(trait, nextState);
  };

  const getTraitStyles = (trait: string) => {
    const state = traitSelections[trait] || "default";
    const traitDef = getTraitDefinition(trait);
    const isConflicted = conflicts.some(c => 
      c.trait1 === trait.toLowerCase() || c.trait2 === trait.toLowerCase()
    );
    
    let baseStyles = "px-3 py-2 text-sm border rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-105";
    
    switch (state) {
      case "included":
        return cn(baseStyles, 
          isConflicted 
            ? "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300" 
            : "bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300"
        );
      case "excluded":
        return cn(baseStyles, "bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300");
      default:
        return cn(baseStyles, "bg-secondary/50 border-border text-foreground hover:bg-secondary/70");
    }
  };

  const getTraitIcon = (trait: string) => {
    const state = traitSelections[trait] || "default";
    const isConflicted = conflicts.some(c => 
      c.trait1 === trait.toLowerCase() || c.trait2 === trait.toLowerCase()
    );
    
    switch (state) {
      case "included":
        return isConflicted ? 
          <AlertTriangle className="w-4 h-4 text-red-500" /> : 
          <CheckCircle2 className="w-4 h-4" />;
      case "excluded":
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRarityBadge = (trait: string) => {
    const traitDef = getTraitDefinition(trait);
    if (!traitDef || traitDef.rarity === 'common') return null;
    
    const rarityColors = {
      uncommon: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      rare: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      legendary: "bg-orange-500/20 text-orange-700 dark:text-orange-300"
    };
    
    return (
      <Badge 
        variant="outline" 
        className={cn("text-xs ml-auto", rarityColors[traitDef.rarity])}
      >
        {traitDef.rarity}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            <strong>Trait Conflicts Detected:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index} className="text-sm">
                  {conflict.reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <Alert className="border-primary/50 bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong className="text-primary">Suggested Traits:</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="bg-primary/20 border-primary/50 text-primary cursor-pointer hover:bg-primary/30"
                  onClick={() => onTraitSelectionChange(suggestion.trait, 'included')}
                >
                  {suggestion.trait} ({Math.round(suggestion.confidence * 100)}%)
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trait Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.entries(TRAIT_CATEGORIES).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          <p className="text-xs text-muted-foreground">Click traits to include/exclude in hybrid</p>
          <div className="grid gap-3">
            {Object.entries(TRAIT_CATEGORIES).map(([categoryKey, category]) => {
              const categoryTraits = categorizedTraits[categoryKey];
              if (categoryTraits.length === 0) return null;
              
              return (
                <div key={categoryKey} className="space-y-2">
                  <h5 className="text-sm font-semibold text-accent flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", `bg-${category.color}-500`)} />
                    {category.name}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {categoryTraits.map((trait, index) => (
                      <button
                        key={index}
                        onClick={(e) => handleTraitClick(trait, e)}
                        className={getTraitStyles(trait)}
                        title={getTraitDefinition(trait)?.description}
                      >
                        {getTraitIcon(trait)}
                        <span>{trait}</span>
                        {getRarityBadge(trait)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {Object.entries(TRAIT_CATEGORIES).map(([categoryKey, category]) => {
          const categoryTraits = categorizedTraits[categoryKey];
          
          return (
            <TabsContent key={categoryKey} value={categoryKey} className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-4 h-4 rounded-full", `bg-${category.color}-500`)} />
                <h4 className="font-semibold">{category.name}</h4>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              
              {categoryTraits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categoryTraits.map((trait, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleTraitClick(trait, e)}
                      className={getTraitStyles(trait)}
                      title={getTraitDefinition(trait)?.description}
                    >
                      {getTraitIcon(trait)}
                      <span>{trait}</span>
                      {getRarityBadge(trait)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No {category.name.toLowerCase()} traits available for this species.
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};