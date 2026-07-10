interface BehavioralTrait {
  id: string;
  name: string;
  description: string;
  intensity: number; // 0-100
  category: 'social' | 'hunting' | 'defensive' | 'territorial' | 'parental';
}

interface HabitatPreference {
  environment: string;
  suitability: number; // 0-100
  reason: string;
}

interface EcosystemRole {
  trophicLevel: 'primary_producer' | 'herbivore' | 'omnivore' | 'carnivore' | 'apex_predator';
  niche: string;
  impact: string;
  interactions: string[];
}

export interface BehavioralProfile {
  personality: BehavioralTrait[];
  socialStructure: string;
  activityPattern: 'diurnal' | 'nocturnal' | 'crepuscular' | 'cathemeral';
  temperament: 'docile' | 'aggressive' | 'curious' | 'territorial' | 'social';
  intelligence: number; // 0-100
  habitatPreferences: HabitatPreference[];
  ecosystemRole: EcosystemRole;
}

export class BehavioralSimulator {
  private static readonly BEHAVIORAL_TEMPLATES = {
    'tyrannosaurus rex': {
      aggression: 90,
      intelligence: 70,
      social: 20,
      territorial: 95,
      hunting: 100,
      parental: 60
    },
    'triceratops': {
      aggression: 40,
      intelligence: 50,
      social: 80,
      territorial: 60,
      hunting: 0,
      parental: 90
    },
    'velociraptor': {
      aggression: 85,
      intelligence: 95,
      social: 90,
      territorial: 70,
      hunting: 95,
      parental: 80
    },
    'stegosaurus': {
      aggression: 30,
      intelligence: 40,
      social: 60,
      territorial: 50,
      hunting: 0,
      parental: 70
    }
  };

  static generateBehavioralProfile(
    dinosaurs: Array<{ name: string; percentage: number }>,
    traitSelections: { [key: string]: any },
    ageStage: 'juvenile' | 'adult'
  ): BehavioralProfile {
    const activeDinosaurs = dinosaurs.filter(d => d.percentage > 0);
    
    // Calculate weighted behavioral scores
    const behavioralScores = this.calculateWeightedBehavior(activeDinosaurs);
    
    // Generate personality traits
    const personality = this.generatePersonalityTraits(behavioralScores, traitSelections);
    
    // Determine social structure
    const socialStructure = this.determineSocialStructure(behavioralScores);
    
    // Determine activity pattern
    const activityPattern = this.determineActivityPattern(behavioralScores);
    
    // Determine temperament
    const temperament = this.determineTemperament(behavioralScores);
    
    // Calculate intelligence
    const intelligence = this.calculateIntelligence(behavioralScores, ageStage);
    
    // Generate habitat preferences
    const habitatPreferences = this.generateHabitatPreferences(activeDinosaurs, behavioralScores);
    
    // Determine ecosystem role
    const ecosystemRole = this.determineEcosystemRole(behavioralScores, activeDinosaurs);

    return {
      personality,
      socialStructure,
      activityPattern,
      temperament,
      intelligence,
      habitatPreferences,
      ecosystemRole
    };
  }

  private static calculateWeightedBehavior(dinosaurs: Array<{ name: string; percentage: number }>) {
    const scores = {
      aggression: 0,
      intelligence: 0,
      social: 0,
      territorial: 0,
      hunting: 0,
      parental: 0
    };

    dinosaurs.forEach(dino => {
      const template = this.BEHAVIORAL_TEMPLATES[dino.name.toLowerCase()];
      if (template) {
        const weight = dino.percentage / 100;
        Object.keys(scores).forEach(key => {
          scores[key] += template[key] * weight;
        });
      }
    });

    return scores;
  }

  private static generatePersonalityTraits(scores: any, traitSelections: any): BehavioralTrait[] {
    const traits: BehavioralTrait[] = [];

    if (scores.aggression > 60) {
      traits.push({
        id: 'aggressive',
        name: 'Aggressive',
        description: 'Shows high levels of aggression towards threats and competition',
        intensity: Math.min(scores.aggression, 100),
        category: 'territorial'
      });
    }

    if (scores.intelligence > 70) {
      traits.push({
        id: 'intelligent',
        name: 'Highly Intelligent',
        description: 'Demonstrates advanced problem-solving and learning capabilities',
        intensity: Math.min(scores.intelligence, 100),
        category: 'social'
      });
    }

    if (scores.social > 60) {
      traits.push({
        id: 'social',
        name: 'Social',
        description: 'Forms complex social bonds and group behaviors',
        intensity: Math.min(scores.social, 100),
        category: 'social'
      });
    }

    if (scores.hunting > 70) {
      traits.push({
        id: 'predatory',
        name: 'Apex Predator',
        description: 'Exhibits sophisticated hunting strategies and techniques',
        intensity: Math.min(scores.hunting, 100),
        category: 'hunting'
      });
    }

    if (scores.parental > 70) {
      traits.push({
        id: 'protective',
        name: 'Protective',
        description: 'Shows strong parental instincts and nest defense behaviors',
        intensity: Math.min(scores.parental, 100),
        category: 'parental'
      });
    }

    return traits;
  }

  private static determineSocialStructure(scores: any): string {
    if (scores.social > 80) return 'Complex pack hierarchy with alpha leadership';
    if (scores.social > 60) return 'Small family groups with cooperative behaviors';
    if (scores.social > 40) return 'Loose aggregations during feeding or mating';
    return 'Primarily solitary with occasional territorial encounters';
  }

  private static determineActivityPattern(scores: any): 'diurnal' | 'nocturnal' | 'crepuscular' | 'cathemeral' {
    if (scores.hunting > 80) return 'crepuscular';
    if (scores.intelligence > 80) return 'diurnal';
    if (scores.aggression > 80) return 'nocturnal';
    return 'cathemeral';
  }

  private static determineTemperament(scores: any): 'docile' | 'aggressive' | 'curious' | 'territorial' | 'social' {
    if (scores.aggression > 70) return 'aggressive';
    if (scores.territorial > 70) return 'territorial';
    if (scores.social > 70) return 'social';
    if (scores.intelligence > 70) return 'curious';
    return 'docile';
  }

  private static calculateIntelligence(scores: any, ageStage: 'juvenile' | 'adult'): number {
    const baseIntelligence = scores.intelligence;
    const ageModifier = ageStage === 'adult' ? 1.0 : 0.7;
    return Math.round(baseIntelligence * ageModifier);
  }

  private static generateHabitatPreferences(
    dinosaurs: Array<{ name: string; percentage: number }>,
    scores: any
  ): HabitatPreference[] {
    const preferences: HabitatPreference[] = [];

    // Forest/Jungle preferences
    if (scores.hunting > 60 || scores.intelligence > 70) {
      preferences.push({
        environment: 'Dense Forest',
        suitability: Math.min(scores.hunting + scores.intelligence, 100),
        reason: 'Provides cover for hunting and complex navigation challenges'
      });
    }

    // Plains preferences
    if (scores.social > 60) {
      preferences.push({
        environment: 'Open Plains',
        suitability: scores.social,
        reason: 'Ideal for herd formations and long-distance communication'
      });
    }

    // Mountain/Rocky preferences
    if (scores.territorial > 70) {
      preferences.push({
        environment: 'Rocky Highlands',
        suitability: scores.territorial,
        reason: 'Elevated positions for territory surveillance and defense'
      });
    }

    // Wetlands preferences
    if (scores.intelligence > 60) {
      preferences.push({
        environment: 'Wetlands',
        suitability: scores.intelligence,
        reason: 'Rich ecosystem provides diverse food sources and water access'
      });
    }

    return preferences.slice(0, 3); // Top 3 preferences
  }

  private static determineEcosystemRole(
    scores: any,
    dinosaurs: Array<{ name: string; percentage: number }>
  ): EcosystemRole {
    let trophicLevel: EcosystemRole['trophicLevel'] = 'omnivore';
    
    if (scores.hunting > 80) {
      trophicLevel = 'apex_predator';
    } else if (scores.hunting > 50) {
      trophicLevel = 'carnivore';
    } else if (scores.hunting < 20) {
      trophicLevel = 'herbivore';
    }

    const niche = this.determineEcologicalNiche(scores);
    const impact = this.determineEcosystemImpact(scores, trophicLevel);
    const interactions = this.determineSpeciesInteractions(scores);

    return {
      trophicLevel,
      niche,
      impact,
      interactions
    };
  }

  private static determineEcologicalNiche(scores: any): string {
    if (scores.hunting > 80) return 'Apex predator maintaining population control';
    if (scores.social > 80) return 'Keystone species influencing herd dynamics';
    if (scores.intelligence > 80) return 'Ecosystem engineer modifying environment';
    return 'Mesopredator with balanced ecological interactions';
  }

  private static determineEcosystemImpact(scores: any, trophicLevel: string): string {
    switch (trophicLevel) {
      case 'apex_predator':
        return 'Controls prey populations and maintains ecosystem balance';
      case 'carnivore':
        return 'Regulates herbivore numbers and scavenges carrion';
      case 'herbivore':
        return 'Shapes vegetation patterns and provides prey base';
      case 'omnivore':
        return 'Flexible feeding maintains food web stability';
      default:
        return 'Contributes to ecosystem complexity and stability';
    }
  }

  private static determineSpeciesInteractions(scores: any): string[] {
    const interactions: string[] = [];

    if (scores.hunting > 60) {
      interactions.push('Predator-prey relationships with medium-sized herbivores');
    }
    
    if (scores.social > 60) {
      interactions.push('Cooperative behaviors within species groups');
    }
    
    if (scores.territorial > 60) {
      interactions.push('Territorial disputes with competing predators');
    }
    
    if (scores.intelligence > 70) {
      interactions.push('Complex problem-solving affecting resource access');
    }

    if (scores.parental > 60) {
      interactions.push('Extended parental care influencing offspring survival');
    }

    return interactions.slice(0, 3);
  }
}