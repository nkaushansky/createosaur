export interface ScientificName {
  genus: string;
  species: string;
  fullName: string;
  etymology: string;
  classification: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
}

export class ScientificNameGenerator {
  private static readonly GENUS_ROOTS = [
    { root: 'Hybrid', meaning: 'mixed origin' },
    { root: 'Genom', meaning: 'genetic' },
    { root: 'Syn', meaning: 'together' },
    { root: 'Neo', meaning: 'new' },
    { root: 'Proto', meaning: 'first' },
    { root: 'Mega', meaning: 'large' },
    { root: 'Micro', meaning: 'small' },
    { root: 'Chimera', meaning: 'composite' },
    { root: 'Fusion', meaning: 'merged' },
    { root: 'Apex', meaning: 'highest' }
  ];

  private static readonly GENUS_SUFFIXES = [
    'saurus', 'raptor', 'ceratops', 'titan', 'rex', 'don', 'nyx', 'tops', 'gnathus', 'morphus'
  ];

  private static readonly SPECIES_DESCRIPTORS = [
    { trait: 'aggressive', terms: ['ferox', 'truculentus', 'bellicosus'] },
    { trait: 'intelligent', terms: ['sapiens', 'astutus', 'perspicax'] },
    { trait: 'social', terms: ['gregarius', 'socialis', 'cooperativus'] },
    { trait: 'large', terms: ['giganteus', 'enormis', 'colossalis'] },
    { trait: 'small', terms: ['minutus', 'parvus', 'pygmaeus'] },
    { trait: 'fast', terms: ['velox', 'celer', 'rapidus'] },
    { trait: 'armored', terms: ['armatus', 'loricatus', 'scutatus'] },
    { trait: 'horned', terms: ['cornutus', 'ceratomorphus', 'bicornis'] },
    { trait: 'predator', terms: ['predatorius', 'carnifex', 'venator'] },
    { trait: 'herbivore', terms: ['herbivorus', 'phytophagus', 'plantivorus'] }
  ];

  private static readonly LOCATION_DESCRIPTORS = [
    'laboratensis', 'artificialis', 'geneticus', 'hybridensis', 'experimentalis',
    'synthesius', 'novaterra', 'futurus', 'modernus', 'technologicus'
  ];

  static generateScientificName(
    dinosaurs: Array<{ name: string; percentage: number }>,
    traits: any,
    creatureSize: number,
    temperament: string
  ): ScientificName {
    const dominantDinosaur = dinosaurs
      .filter(d => d.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)[0];

    // Generate genus
    const genus = this.generateGenus(dinosaurs, creatureSize, temperament);
    
    // Generate species
    const species = this.generateSpecies(traits, temperament, creatureSize);
    
    const fullName = `${genus} ${species}`;
    
    // Generate etymology
    const etymology = this.generateEtymology(genus, species, dominantDinosaur?.name);
    
    // Generate classification
    const classification = this.generateClassification(genus, species);

    return {
      genus,
      species,
      fullName,
      etymology,
      classification
    };
  }

  private static generateGenus(
    dinosaurs: Array<{ name: string; percentage: number }>,
    creatureSize: number,
    temperament: string
  ): string {
    const activeDinosaurs = dinosaurs.filter(d => d.percentage > 0);
    
    let genusRoot: string;
    
    if (activeDinosaurs.length > 2) {
      genusRoot = 'Chimera';
    } else if (creatureSize > 75) {
      genusRoot = 'Mega';
    } else if (creatureSize < 25) {
      genusRoot = 'Micro';
    } else if (temperament === 'aggressive') {
      genusRoot = 'Apex';
    } else if (temperament === 'social') {
      genusRoot = 'Syn';
    } else {
      genusRoot = 'Neo';
    }

    // Choose suffix based on dominant traits
    let suffix: string;
    if (dinosaurs.some(d => d.name.toLowerCase().includes('raptor'))) {
      suffix = 'raptor';
    } else if (dinosaurs.some(d => d.name.toLowerCase().includes('rex'))) {
      suffix = 'rex';
    } else if (dinosaurs.some(d => d.name.toLowerCase().includes('ceratops'))) {
      suffix = 'ceratops';
    } else {
      suffix = 'saurus';
    }

    return genusRoot.toLowerCase() + suffix;
  }

  private static generateSpecies(
    traits: any,
    temperament: string,
    creatureSize: number
  ): string {
    const descriptors: string[] = [];

    // Size descriptors
    if (creatureSize > 80) {
      descriptors.push(...this.SPECIES_DESCRIPTORS.find(d => d.trait === 'large')?.terms || []);
    } else if (creatureSize < 30) {
      descriptors.push(...this.SPECIES_DESCRIPTORS.find(d => d.trait === 'small')?.terms || []);
    }

    // Temperament descriptors
    const temperamentDescriptors = this.SPECIES_DESCRIPTORS.find(d => d.trait === temperament)?.terms || [];
    descriptors.push(...temperamentDescriptors);

    // Trait-based descriptors
    Object.keys(traits || {}).forEach(trait => {
      const traitDescriptors = this.SPECIES_DESCRIPTORS.find(d => 
        trait.toLowerCase().includes(d.trait)
      )?.terms || [];
      descriptors.push(...traitDescriptors);
    });

    // If no specific descriptors found, use laboratory descriptors
    if (descriptors.length === 0) {
      descriptors.push(...this.LOCATION_DESCRIPTORS);
    }

    // Return a random descriptor or default
    return descriptors[Math.floor(Math.random() * descriptors.length)] || 'laboratensis';
  }

  private static generateEtymology(genus: string, species: string, dominantSpecies?: string): string {
    const genusEtymology = this.getGenusEtymology(genus);
    const speciesEtymology = this.getSpeciesEtymology(species);
    
    let etymology = `${genusEtymology}; ${speciesEtymology}`;
    
    if (dominantSpecies) {
      etymology += `. Named for its primary genetic contribution from ${dominantSpecies}.`;
    }
    
    etymology += ' Created through advanced genetic engineering techniques.';
    
    return etymology;
  }

  private static getGenusEtymology(genus: string): string {
    if (genus.includes('chimera')) return 'Chimera (Greek: composite being)';
    if (genus.includes('mega')) return 'Mega (Greek: large, great)';
    if (genus.includes('micro')) return 'Micro (Greek: small)';
    if (genus.includes('neo')) return 'Neo (Greek: new, recent)';
    if (genus.includes('syn')) return 'Syn (Greek: together, with)';
    if (genus.includes('apex')) return 'Apex (Latin: summit, peak)';
    if (genus.includes('hybrid')) return 'Hybrid (Latin: mixed offspring)';
    return 'Laboratory-created genus name';
  }

  private static getSpeciesEtymology(species: string): string {
    const etymologies = {
      'ferox': 'Latin: fierce, wild',
      'sapiens': 'Latin: wise, intelligent',
      'gregarius': 'Latin: belonging to a flock',
      'giganteus': 'Latin: gigantic',
      'minutus': 'Latin: small, minute',
      'velox': 'Latin: swift, rapid',
      'armatus': 'Latin: armed, armored',
      'cornutus': 'Latin: horned',
      'predatorius': 'Latin: predatory',
      'herbivorus': 'Latin: plant-eating',
      'laboratensis': 'Latin: of the laboratory',
      'artificialis': 'Latin: artificial, man-made',
      'geneticus': 'Latin: relating to genes',
      'hybridensis': 'Latin: of hybrid origin'
    };

    return etymologies[species] || 'Latin: laboratory designation';
  }

  private static generateClassification(genus: string, species: string) {
    return {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Reptilia',
      order: 'Dinosauria',
      family: 'Hybrididae',
      genus: genus.charAt(0).toUpperCase() + genus.slice(1),
      species: `${genus.charAt(0).toUpperCase() + genus.slice(1)} ${species}`
    };
  }
}