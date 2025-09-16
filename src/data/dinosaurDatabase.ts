/**
 * Comprehensive dinosaur species database for Createosaur
 * 
 * This database contains detailed information about various dinosaur species
 * organized by period and including scientific classification, traits, and
 * characteristics for accurate genetic engineering simulations.
 */

export interface DinosaurSpecies {
  id: string;
  name: string;
  scientificName: string;
  period: string;
  era: string;
  diet: 'Carnivore' | 'Herbivore' | 'Omnivore' | 'Piscivore' | 'Insectivore';
  size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Massive';
  habitat: string;
  traits: string[];
  description: string;
  lengthMeters: number;
  weightKg: number;
  discoveryLocation: string;
}

export const dinosaurDatabase: DinosaurSpecies[] = [
  // Triassic Period
  {
    id: "coelophysis",
    name: "Coelophysis",
    scientificName: "Coelophysis bauri",
    period: "Late Triassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Small",
    habitat: "Forests and plains",
    traits: ["Bipedal", "Pack hunter", "Slender build", "Long tail"],
    description: "One of the earliest well-known dinosaurs, a swift pack hunter",
    lengthMeters: 3,
    weightKg: 20,
    discoveryLocation: "New Mexico, USA"
  },
  {
    id: "plateosaurus",
    name: "Plateosaurus",
    scientificName: "Plateosaurus trossingensis",
    period: "Late Triassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Woodlands and plains",
    traits: ["Long neck", "Bipedal/Quadrupedal", "Strong hindlimbs", "Serrated teeth"],
    description: "Early long-necked herbivore, ancestor to sauropods",
    lengthMeters: 8,
    weightKg: 4000,
    discoveryLocation: "Germany"
  },

  // Early Jurassic Period
  {
    id: "dilophosaurus",
    name: "Dilophosaurus",
    scientificName: "Dilophosaurus wetherilli",
    period: "Early Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Forests and riversides",
    traits: ["Double crest", "Agile hunter", "Weak bite", "Strong legs"],
    description: "Distinctive crested predator with elaborate head ornaments",
    lengthMeters: 7,
    weightKg: 400,
    discoveryLocation: "Arizona, USA"
  },
  {
    id: "cryolophosaurus",
    name: "Cryolophosaurus",
    scientificName: "Cryolophosaurus ellioti",
    period: "Early Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Polar forests",
    traits: ["Frozen crest", "Cold adaptation", "Powerful predator", "Unique crest"],
    description: "The 'Elvisaurus' - a crested predator from Antarctica",
    lengthMeters: 6.5,
    weightKg: 465,
    discoveryLocation: "Antarctica"
  },

  // Middle Jurassic Period
  {
    id: "megalosaurus",
    name: "Megalosaurus",
    scientificName: "Megalosaurus bucklandii",
    period: "Middle Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Coastal plains",
    traits: ["First named dinosaur", "Powerful jaw", "Bipedal predator", "Strong claws"],
    description: "The first dinosaur ever scientifically named and described",
    lengthMeters: 9,
    weightKg: 1000,
    discoveryLocation: "England"
  },

  // Late Jurassic Period
  {
    id: "allosaurus",
    name: "Allosaurus",
    scientificName: "Allosaurus fragilis",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Floodplains and forests",
    traits: ["Powerful hunter", "Large claws", "Distinctive skull", "Ambush predator"],
    description: "Dominant predator of the Late Jurassic, the 'lion' of its time",
    lengthMeters: 9.7,
    weightKg: 2300,
    discoveryLocation: "Colorado, USA"
  },
  {
    id: "brontosaurus",
    name: "Brontosaurus",
    scientificName: "Brontosaurus excelsus",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Massive",
    habitat: "River valleys and plains",
    traits: ["Long neck", "Massive size", "Whip tail", "High browser"],
    description: "The 'Thunder Lizard' - a massive long-necked giant",
    lengthMeters: 22,
    weightKg: 15000,
    discoveryLocation: "Wyoming, USA"
  },
  {
    id: "diplodocus",
    name: "Diplodocus",
    scientificName: "Diplodocus longus",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Massive",
    habitat: "Floodplains",
    traits: ["Extremely long", "Whip tail", "Low browser", "Pencil teeth"],
    description: "One of the longest dinosaurs ever discovered",
    lengthMeters: 26,
    weightKg: 11000,
    discoveryLocation: "Colorado, USA"
  },
  {
    id: "brachiosaurs",
    name: "Brachiosaurus",
    scientificName: "Brachiosaurus altithorax",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Massive",
    habitat: "Woodlands",
    traits: ["High browser", "Long front legs", "Massive size", "Giraffe-like"],
    description: "Towering high-browser that could reach treetops",
    lengthMeters: 23,
    weightKg: 28000,
    discoveryLocation: "Colorado, USA"
  },
  {
    id: "camarasaurus",
    name: "Camarasaurus",
    scientificName: "Camarasaurus supremus",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Floodplains",
    traits: ["Box-like skull", "Spoon teeth", "Strong build", "Herd animal"],
    description: "Common sauropod with robust build and distinctive skull",
    lengthMeters: 18,
    weightKg: 18000,
    discoveryLocation: "Colorado, USA"
  },

  // Early Cretaceous Period
  {
    id: "spinosaurus",
    name: "Spinosaurus",
    scientificName: "Spinosaurus aegyptiacus",
    period: "Early Cretaceous",
    era: "Mesozoic",
    diet: "Piscivore",
    size: "Massive",
    habitat: "Rivers and swamps",
    traits: ["Sail back", "Semi-aquatic", "Fish eater", "Paddle tail"],
    description: "Largest known carnivorous dinosaur, adapted for aquatic life",
    lengthMeters: 15,
    weightKg: 7400,
    discoveryLocation: "Egypt"
  },
  {
    id: "iguanodon",
    name: "Iguanodon",
    scientificName: "Iguanodon bernissartensis",
    period: "Early Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Forests and plains",
    traits: ["Thumb spikes", "Bipedal/Quadrupedal", "Duck bill", "Herd animal"],
    description: "One of the first dinosaurs discovered, with distinctive thumb spikes",
    lengthMeters: 10,
    weightKg: 3200,
    discoveryLocation: "Belgium"
  },
  {
    id: "utahraptor",
    name: "Utahraptor",
    scientificName: "Utahraptor ostrommaysi",
    period: "Early Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Forests",
    traits: ["Giant sickle claw", "Pack hunter", "Feathered", "Intelligent"],
    description: "Largest known dromaeosaurid, a giant raptor",
    lengthMeters: 7,
    weightKg: 1500,
    discoveryLocation: "Utah, USA"
  },
  {
    id: "acrocanthosaurus",
    name: "Acrocanthosaurus",
    scientificName: "Acrocanthosaurus atokensis",
    period: "Early Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Forests and plains",
    traits: ["High spines", "Powerful predator", "Strong arms", "Ridge back"],
    description: "Large predator with distinctive high neural spines",
    lengthMeters: 11.5,
    weightKg: 6200,
    discoveryLocation: "Oklahoma, USA"
  },

  // Late Cretaceous Period
  {
    id: "tyrannosaurus",
    name: "Tyrannosaurus Rex",
    scientificName: "Tyrannosaurus rex",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Massive",
    habitat: "Forests and plains",
    traits: ["Massive jaw", "Tiny arms", "Apex predator", "Bipedal"],
    description: "The king of dinosaurs, most famous apex predator of all time",
    lengthMeters: 12.3,
    weightKg: 8400,
    discoveryLocation: "Montana, USA"
  },
  {
    id: "triceratops",
    name: "Triceratops",
    scientificName: "Triceratops horridus",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Plains and woodlands",
    traits: ["Three horns", "Bony frill", "Powerful charge", "Herd animal"],
    description: "Three-horned herbivore that could defend itself against T-Rex",
    lengthMeters: 9,
    weightKg: 12000,
    discoveryLocation: "North America"
  },
  {
    id: "velociraptor", 
    name: "Velociraptor",
    scientificName: "Velociraptor mongoliensis",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Small",
    habitat: "Desert plains",
    traits: ["Sickle claw", "Pack hunter", "Intelligent", "Feathered"],
    description: "Intelligent pack hunter with deadly sickle claws",
    lengthMeters: 2,
    weightKg: 15,
    discoveryLocation: "Mongolia"
  },
  {
    id: "stegosaurus",
    name: "Stegosaurus",
    scientificName: "Stegosaurus stenops",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Fern prairies",
    traits: ["Back plates", "Tail spikes", "Small brain", "Low browser"],
    description: "Iconic plated dinosaur with defensive tail spikes",
    lengthMeters: 9,
    weightKg: 5000,
    discoveryLocation: "Colorado, USA"
  },
  {
    id: "carnotaurus",
    name: "Carnotaurus",
    scientificName: "Carnotaurus sastrei",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Large",
    habitat: "Plains and forests",
    traits: ["Horned skull", "Speed runner", "Tiny arms", "Forward-facing eyes"],
    description: "The 'Meat-eating Bull' - built for speed with distinctive horns",
    lengthMeters: 8,
    weightKg: 1350,
    discoveryLocation: "Argentina"
  },
  {
    id: "giganotosaurus",
    name: "Giganotosaurus",
    scientificName: "Giganotosaurus carolinii",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Massive",
    habitat: "River valleys",
    traits: ["Massive size", "Pack hunter", "Narrow skull", "Powerful legs"],
    description: "One of the largest known carnivorous dinosaurs",
    lengthMeters: 13,
    weightKg: 8200,
    discoveryLocation: "Argentina"
  },
  {
    id: "ankylosaurus",
    name: "Ankylosaurus",
    scientificName: "Ankylosaurus magniventris",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Forests and plains",
    traits: ["Armored shell", "Club tail", "Tank-like", "Low browser"],
    description: "Living tank with heavy armor and devastating tail club",
    lengthMeters: 6.25,
    weightKg: 6000,
    discoveryLocation: "Montana, USA"
  },
  {
    id: "parasaurolophus",
    name: "Parasaurolophus",
    scientificName: "Parasaurolophus walkeri",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Large",
    habitat: "Coastal plains",
    traits: ["Tube crest", "Duck bill", "Sound maker", "Herd animal"],
    description: "Musical hadrosaur that could produce trumpeting calls",
    lengthMeters: 9.5,
    weightKg: 2500,
    discoveryLocation: "Alberta, Canada"
  },
  {
    id: "therizinosaurus",
    name: "Therizinosaurus",
    scientificName: "Therizinosaurus cheloniformis",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Massive",
    habitat: "Forests",
    traits: ["Giant claws", "Feathered", "Herbivore", "Massive size"],
    description: "Giant herbivore with enormous claws for stripping vegetation",
    lengthMeters: 16,
    weightKg: 5000,
    discoveryLocation: "Mongolia"
  },
  {
    id: "dracorex",
    name: "Dracorex",
    scientificName: "Dracorex hogwartsia",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Herbivore",
    size: "Small",
    habitat: "Forests",
    traits: ["Dragon skull", "Spiky head", "Bipedal", "Herbivore"],
    description: "The 'Dragon King of Hogwarts' with an elaborate spiky skull",
    lengthMeters: 4,
    weightKg: 45,
    discoveryLocation: "South Dakota, USA"
  },

  // Flying Reptiles (Pterosaurs)
  {
    id: "pteranodon",
    name: "Pteranodon",
    scientificName: "Pteranodon longiceps",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Piscivore",
    size: "Large",
    habitat: "Coastal areas",
    traits: ["Flying ability", "Wing membranes", "Fish eater", "Large crest"],
    description: "Large flying reptile that soared over ancient seas",
    lengthMeters: 6,
    weightKg: 25,
    discoveryLocation: "Kansas, USA"
  },
  {
    id: "quetzalcoatlus",
    name: "Quetzalcoatlus",
    scientificName: "Quetzalcoatlus northropi",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Massive",
    habitat: "Inland plains",
    traits: ["Giant wingspan", "Giraffe height", "Scavenger", "Toothless"],
    description: "Largest known flying animal, with wingspan rivaling small aircraft",
    lengthMeters: 10,
    weightKg: 250,
    discoveryLocation: "Texas, USA"
  },

  // Marine Reptiles
  {
    id: "mosasaurus",
    name: "Mosasaurus",
    scientificName: "Mosasaurus hoffmanni",
    period: "Late Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Massive",
    habitat: "Oceans",
    traits: ["Marine predator", "Powerful swimmer", "Large teeth", "Paddle limbs"],
    description: "Massive marine lizard, apex predator of ancient seas",
    lengthMeters: 17,
    weightKg: 14000,
    discoveryLocation: "Netherlands"
  },
  {
    id: "plesiosaurs",
    name: "Plesiosaurus",
    scientificName: "Plesiosaurus dolichodeirus",
    period: "Early Jurassic",
    era: "Mesozoic",
    diet: "Piscivore",
    size: "Large",
    habitat: "Oceans",
    traits: ["Long neck", "Marine adaptation", "Four flippers", "Fish eater"],
    description: "Long-necked marine reptile, ancient ocean wanderer",
    lengthMeters: 3.5,
    weightKg: 450,
    discoveryLocation: "England"
  },

  // Small and Unique Species
  {
    id: "microraptor",
    name: "Microraptor",
    scientificName: "Microraptor zhaoianus",
    period: "Early Cretaceous",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Tiny",
    habitat: "Forest canopy",
    traits: ["Four wings", "Gliding flight", "Black feathers", "Arboreal"],
    description: "Four-winged feathered dinosaur capable of gliding between trees",
    lengthMeters: 0.6,
    weightKg: 1,
    discoveryLocation: "China"
  },
  {
    id: "compsognathus",
    name: "Compsognathus",
    scientificName: "Compsognathus longipes",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Tiny",
    habitat: "Islands and lagoons",
    traits: ["Chicken-sized", "Fast runner", "Small predator", "Bipedal"],
    description: "One of the smallest known dinosaurs, chicken-sized predator",
    lengthMeters: 1,
    weightKg: 3,
    discoveryLocation: "Germany"
  },
  {
    id: "archaeopteryx",
    name: "Archaeopteryx",
    scientificName: "Archaeopteryx lithographica",
    period: "Late Jurassic",
    era: "Mesozoic",
    diet: "Carnivore",
    size: "Small",
    habitat: "Islands and lagoons",
    traits: ["Primitive feathers", "Flying ability", "Dinosaur-bird link", "Clawed wings"],
    description: "Transitional form between dinosaurs and birds",
    lengthMeters: 0.5,
    weightKg: 1,
    discoveryLocation: "Germany"
  }
];

/**
 * Search the dinosaur database by name, scientific name, period, or traits
 */
export function searchDinosaurs(query: string): DinosaurSpecies[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];
  
  return dinosaurDatabase.filter(dinosaur => 
    dinosaur.name.toLowerCase().includes(searchTerm) ||
    dinosaur.scientificName.toLowerCase().includes(searchTerm) ||
    dinosaur.period.toLowerCase().includes(searchTerm) ||
    dinosaur.traits.some(trait => trait.toLowerCase().includes(searchTerm)) ||
    dinosaur.diet.toLowerCase().includes(searchTerm) ||
    dinosaur.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get dinosaurs by period
 */
export function getDinosaursByPeriod(period: string): DinosaurSpecies[] {
  return dinosaurDatabase.filter(dinosaur => 
    dinosaur.period.toLowerCase() === period.toLowerCase()
  );
}

/**
 * Get random dinosaur suggestions
 */
export function getRandomDinosaurs(count: number = 5): DinosaurSpecies[] {
  const shuffled = [...dinosaurDatabase].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}