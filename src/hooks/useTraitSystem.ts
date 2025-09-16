import { useMemo } from 'react';
import { TraitSelection, TraitState } from '@/components/DinosaurCard';
import { 
  TRAIT_DEFINITIONS, 
  TraitConflict, 
  TraitSuggestion, 
  TraitDefinition 
} from '@/types/traits';

export const useTraitSystem = (
  traitSelections: { [dinosaurId: string]: TraitSelection },
  dinosaurs: Array<{ id: string; traits: string[] }>
) => {
  // Get all included traits across all dinosaurs
  const includedTraits = useMemo(() => {
    const traits: string[] = [];
    Object.entries(traitSelections).forEach(([dinosaurId, selections]) => {
      Object.entries(selections).forEach(([trait, state]) => {
        if (state === 'included') {
          traits.push(trait.toLowerCase());
        }
      });
    });
    return traits;
  }, [traitSelections]);

  // Detect conflicts between included traits
  const conflicts = useMemo((): TraitConflict[] => {
    const conflicts: TraitConflict[] = [];
    
    includedTraits.forEach(trait1 => {
      const traitDef1 = TRAIT_DEFINITIONS[trait1];
      if (!traitDef1) return;
      
      includedTraits.forEach(trait2 => {
        if (trait1 >= trait2) return; // Avoid duplicates and self-comparison
        
        if (traitDef1.conflicts.includes(trait2)) {
          conflicts.push({
            trait1,
            trait2,
            reason: `${traitDef1.name} is incompatible with ${TRAIT_DEFINITIONS[trait2]?.name || trait2}`,
            severity: 'error'
          });
        }
      });
    });
    
    return conflicts;
  }, [includedTraits]);

  // Generate smart trait suggestions
  const suggestions = useMemo((): TraitSuggestion[] => {
    const suggestions: TraitSuggestion[] = [];
    const allAvailableTraits = new Set<string>();
    
    // Collect all available traits from dinosaurs
    dinosaurs.forEach(dino => {
      dino.traits.forEach(trait => {
        allAvailableTraits.add(trait.toLowerCase());
      });
    });
    
    // Find synergistic traits
    includedTraits.forEach(includedTrait => {
      const traitDef = TRAIT_DEFINITIONS[includedTrait];
      if (!traitDef) return;
      
      traitDef.synergies.forEach(synergyTrait => {
        if (
          allAvailableTraits.has(synergyTrait) && 
          !includedTraits.includes(synergyTrait) &&
          !isTraitExcluded(synergyTrait)
        ) {
          const confidence = calculateSynergyConfidence(includedTrait, synergyTrait);
          suggestions.push({
            trait: synergyTrait,
            reason: `Works well with ${traitDef.name}`,
            confidence
          });
        }
      });
    });
    
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = suggestions.reduce((acc, suggestion) => {
      const existing = acc.find(s => s.trait === suggestion.trait);
      if (!existing || existing.confidence < suggestion.confidence) {
        return [...acc.filter(s => s.trait !== suggestion.trait), suggestion];
      }
      return acc;
    }, [] as TraitSuggestion[]);
    
    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 suggestions
  }, [includedTraits, dinosaurs, traitSelections]);

  const isTraitExcluded = (trait: string): boolean => {
    return Object.values(traitSelections).some(selections => 
      selections[trait] === 'excluded'
    );
  };

  const calculateSynergyConfidence = (trait1: string, trait2: string): number => {
    const def1 = TRAIT_DEFINITIONS[trait1];
    const def2 = TRAIT_DEFINITIONS[trait2];
    
    if (!def1 || !def2) return 0.5;
    
    let confidence = 0.6; // Base confidence
    
    // Same category bonus
    if (def1.category === def2.category) {
      confidence += 0.2;
    }
    
    // Rarity considerations
    if (def2.rarity === 'rare' || def2.rarity === 'legendary') {
      confidence += 0.1;
    }
    
    // Bidirectional synergy bonus
    if (def2.synergies.includes(trait1)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  };

  const getTraitsByCategory = (traits: string[]) => {
    const categorized: Record<string, string[]> = {
      physical: [],
      behavioral: [],
      defensive: [],
      hunting: [],
      environmental: []
    };
    
    traits.forEach(trait => {
      const traitDef = TRAIT_DEFINITIONS[trait.toLowerCase()];
      if (traitDef) {
        categorized[traitDef.category].push(trait);
      } else {
        // Default categorization for unknown traits
        categorized.physical.push(trait);
      }
    });
    
    return categorized;
  };

  const getTraitDefinition = (trait: string): TraitDefinition | undefined => {
    return TRAIT_DEFINITIONS[trait.toLowerCase()];
  };

  return {
    conflicts,
    suggestions,
    getTraitsByCategory,
    getTraitDefinition,
    includedTraits
  };
};