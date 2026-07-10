import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Info, Clock, Utensils, Ruler, Upload, X } from "lucide-react";
import { dinosaurDatabase, searchDinosaurs, getRandomDinosaurs, type DinosaurSpecies } from "../data/dinosaurDatabase";

interface Species {
  id: string;
  name: string;
  scientificName: string;
  period: string;
  traits: string[];
}

interface AddSpeciesSelectorProps {
  availableSpecies: Species[];
  onAddSpecies: (species: Species) => void;
}

export const AddSpeciesSelector = ({ availableSpecies, onAddSpecies }: AddSpeciesSelectorProps) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DinosaurSpecies[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [randomDiscoveries, setRandomDiscoveries] = useState<DinosaurSpecies[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDinosaur, setCustomDinosaur] = useState({
    name: '',
    scientificName: '',
    period: '',
    diet: 'Herbivore' as 'Carnivore' | 'Herbivore' | 'Omnivore' | 'Piscivore' | 'Insectivore',
    size: 'Medium' as 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Massive',
    traits: [] as string[],
    description: ''
  });

  // Get species not already in lab
  const currentSpeciesIds = availableSpecies.map(s => s.id);
  const availableFromDatabase = dinosaurDatabase.filter(species => 
    !currentSpeciesIds.includes(species.id)
  );

  // Popular species for quick selection
  const popularSpecies = availableFromDatabase.filter(species => 
    ['tyrannosaurus', 'triceratops', 'velociraptor', 'brachiosaurs', 'stegosaurus', 
     'allosaurus', 'spinosaurus', 'carnotaurus', 'ankylosaurus', 'parasaurolophus'].includes(species.id)
  );

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = searchDinosaurs(searchTerm).filter(species => 
        !currentSpeciesIds.includes(species.id)
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchTerm, currentSpeciesIds]);

  // Initialize random discoveries and refresh when species list changes
  useEffect(() => {
    const availableForRandom = availableFromDatabase.filter(species => 
      !currentSpeciesIds.includes(species.id)
    );
    const random = getRandomDinosaurs(4).filter(species => 
      !currentSpeciesIds.includes(species.id)
    ).slice(0, 4);
    setRandomDiscoveries(random);
  }, [currentSpeciesIds.join(','), availableFromDatabase.length]);

  const convertToSpecies = (dinosaur: DinosaurSpecies): Species => ({
    id: dinosaur.id,
    name: dinosaur.name,
    scientificName: dinosaur.scientificName,
    period: dinosaur.period,
    traits: dinosaur.traits
  });

  const handleAddSpecies = (dinosaur: DinosaurSpecies) => {
    onAddSpecies(convertToSpecies(dinosaur));
    setSelectedSpecies("");
    setSearchTerm("");
    setShowSearchResults(false);
    setShowDetails(null);
  };

  const handleDropdownAdd = () => {
    if (selectedSpecies) {
      const species = availableFromDatabase.find(s => s.id === selectedSpecies);
      if (species) {
        handleAddSpecies(species);
      }
    }
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'Tiny': return '🐣';
      case 'Small': return '🦖';
      case 'Medium': return '🦕';
      case 'Large': return '🦴';
      case 'Massive': return '🗿';
      default: return '❓';
    }
  };

  const getDietIcon = (diet: string) => {
    switch (diet) {
      case 'Carnivore': return '🥩';
      case 'Herbivore': return '🌿';
      case 'Omnivore': return '🍽️';
      case 'Piscivore': return '🐟';
      case 'Insectivore': return '🐛';
      default: return '❓';
    }
  };

  const handleCreateCustomDinosaur = () => {
    if (!customDinosaur.name.trim()) return;
    
    const customSpecies: Species = {
      id: `custom-${Date.now()}`,
      name: customDinosaur.name,
      scientificName: customDinosaur.scientificName || `${customDinosaur.name} sp.`,
      period: customDinosaur.period || 'Custom Period',
      traits: customDinosaur.traits.length > 0 ? customDinosaur.traits : [customDinosaur.diet, customDinosaur.size, 'Custom creature']
    };

    onAddSpecies(customSpecies);
    
    // Reset form
    setCustomDinosaur({
      name: '',
      scientificName: '',
      period: '',
      diet: 'Herbivore',
      size: 'Medium',
      traits: [],
      description: ''
    });
    setShowCustomForm(false);
  };

  const addCustomTrait = (trait: string) => {
    if (trait.trim() && !customDinosaur.traits.includes(trait.trim())) {
      setCustomDinosaur(prev => ({
        ...prev,
        traits: [...prev.traits, trait.trim()]
      }));
    }
  };

  const removeCustomTrait = (index: number) => {
    setCustomDinosaur(prev => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== index)
    }));
  };

  if (availableFromDatabase.length === 0) {
    return (
      <Card className="glass p-4">
        <div className="text-center text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">All species have been added to the lab!</p>
          <p className="text-xs mt-1">You have access to {dinosaurDatabase.length} species total.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">Add Species to Lab</h4>
          <Badge variant="secondary" className="text-xs">
            {availableFromDatabase.length} available
          </Badge>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search any dinosaur species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input/50 border-border"
          />
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Found {searchResults.length} species matching "{searchTerm}"
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.slice(0, 8).map((species) => (
                <Card key={species.id} className="p-3 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm truncate">{species.name}</h5>
                        <span className="text-lg" title={`Size: ${species.size}`}>
                          {getSizeIcon(species.size)}
                        </span>
                        <span className="text-lg" title={`Diet: ${species.diet}`}>
                          {getDietIcon(species.diet)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground italic truncate">
                        {species.scientificName}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {species.period}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {species.lengthMeters}m
                        </div>
                      </div>
                      {showDetails === species.id && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {species.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {species.traits.map((trait, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleAddSpecies(species)}
                        className="btn-genetic"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDetails(showDetails === species.id ? null : species.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Search Results */}
        {showSearchResults && searchResults.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No species found for "{searchTerm}"</p>
            <p className="text-xs mt-1">Try different keywords like period names or traits</p>
          </div>
        )}

        {/* Popular Species Dropdown (when not searching) */}
        {!showSearchResults && popularSpecies.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Quick Add Popular Species</div>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger className="bg-input/50 border-border">
                <SelectValue placeholder="Choose a popular species..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {popularSpecies.map((species) => (
                  <SelectItem 
                    key={species.id} 
                    value={species.id}
                    className="cursor-pointer hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getSizeIcon(species.size)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">{species.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {species.period} • {species.diet}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSpecies && (
              <Button 
                onClick={handleDropdownAdd}
                size="sm"
                className="w-full btn-genetic"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Lab
              </Button>
            )}
          </div>
        )}

        {/* Random Suggestions (when not searching) */}
        {!showSearchResults && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Random Discoveries</div>
            <div className="grid grid-cols-2 gap-2">
              {randomDiscoveries.map((species) => (
                <Button
                  key={species.id}
                  variant="outline"
                  size="sm"
                  className="h-auto p-2 btn-lab text-left"
                  onClick={() => handleAddSpecies(species)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-base">{getSizeIcon(species.size)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{species.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {species.period.split(' ')[0]}
                      </div>
                    </div>
                    <Plus className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Dinosaur Creation */}
        {!showSearchResults && (
          <div className="space-y-2">
            {!showCustomForm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full btn-lab"
                onClick={() => setShowCustomForm(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Create Custom Species
              </Button>
            ) : (
              <Card className="p-3 bg-accent/20 border-accent/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">Create Custom Species</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomForm(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Name *</label>
                      <Input
                        placeholder="e.g., Dracorex"
                        value={customDinosaur.name}
                        onChange={(e) => setCustomDinosaur(prev => ({...prev, name: e.target.value}))}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Scientific Name</label>
                      <Input
                        placeholder="e.g., Dracorex hogwartsia"
                        value={customDinosaur.scientificName}
                        onChange={(e) => setCustomDinosaur(prev => ({...prev, scientificName: e.target.value}))}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Period</label>
                      <Select
                        value={customDinosaur.period}
                        onValueChange={(value) => setCustomDinosaur(prev => ({...prev, period: value}))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Late Triassic">Late Triassic</SelectItem>
                          <SelectItem value="Early Jurassic">Early Jurassic</SelectItem>
                          <SelectItem value="Middle Jurassic">Middle Jurassic</SelectItem>
                          <SelectItem value="Late Jurassic">Late Jurassic</SelectItem>
                          <SelectItem value="Early Cretaceous">Early Cretaceous</SelectItem>
                          <SelectItem value="Late Cretaceous">Late Cretaceous</SelectItem>
                          <SelectItem value="Custom Period">Custom Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Diet</label>
                      <Select
                        value={customDinosaur.diet}
                        onValueChange={(value: any) => setCustomDinosaur(prev => ({...prev, diet: value}))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Carnivore">🥩 Carnivore</SelectItem>
                          <SelectItem value="Herbivore">🌿 Herbivore</SelectItem>
                          <SelectItem value="Omnivore">🍽️ Omnivore</SelectItem>
                          <SelectItem value="Piscivore">🐟 Piscivore</SelectItem>
                          <SelectItem value="Insectivore">🐛 Insectivore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Size</label>
                      <Select
                        value={customDinosaur.size}
                        onValueChange={(value: any) => setCustomDinosaur(prev => ({...prev, size: value}))}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tiny">🐣 Tiny</SelectItem>
                          <SelectItem value="Small">🦖 Small</SelectItem>
                          <SelectItem value="Medium">🦕 Medium</SelectItem>
                          <SelectItem value="Large">🦴 Large</SelectItem>
                          <SelectItem value="Massive">🗿 Massive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Add Custom Traits</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="e.g., Long claws, Pack hunter"
                        className="text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addCustomTrait(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addCustomTrait(input.value);
                          input.value = '';
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    {customDinosaur.traits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {customDinosaur.traits.map((trait, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs cursor-pointer"
                            onClick={() => removeCustomTrait(index)}
                          >
                            {trait} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateCustomDinosaur}
                    size="sm"
                    className="w-full btn-genetic"
                    disabled={!customDinosaur.name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Species to Lab
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Database Stats */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground text-center">
            Database: {dinosaurDatabase.length} species across all periods
          </div>
        </div>
      </div>
    </Card>
  );
};