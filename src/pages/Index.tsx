import { useState } from "react";
import { GeneticLab } from "@/components/GeneticLab";
import { GenerationGallery } from "@/components/GenerationGallery";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Dna, Beaker, Zap, ArrowLeft, Key } from "lucide-react";
import labBackground from "@/assets/lab-background.jpg";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'lab' | 'gallery'>('home');
  const [regenerationParams, setRegenerationParams] = useState<any>(null);
  const [creatures, setCreatures] = useState(() => {
    // Load creatures from localStorage on component mount
    const saved = localStorage.getItem('createosaur-creatures');
    return saved ? JSON.parse(saved) : [];
  });

  // Save creatures to localStorage whenever the list changes
  const saveCreatures = (newCreatures: any[]) => {
    setCreatures(newCreatures);
    localStorage.setItem('createosaur-creatures', JSON.stringify(newCreatures));
  };

  const handleDeleteCreature = (id: string) => {
    saveCreatures(creatures.filter((c: any) => c.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    saveCreatures(creatures.map((c: any) => 
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  };

  const handleRateCreature = (id: string, rating: number) => {
    saveCreatures(creatures.map((c: any) => 
      c.id === id ? { ...c, rating } : c
    ));
  };

  const handleRenameCreature = (id: string, newName: string) => {
    saveCreatures(creatures.map((c: any) => 
      c.id === id ? { ...c, name: newName } : c
    ));
  };

  const handleSelectCreature = (creature: any) => {
    // Could navigate to detail view or load into lab
    console.log('Selected creature:', creature);
  };

  const handleRegenerate = (params: any) => {
    // Extract species names from the creature data
    const speciesNames = params.species || [];
    
    // Prepare regeneration parameters
    const regenParams = {
      species: speciesNames,
      traits: params.traitSelections || {},
      customPrompt: params.customPrompt || '',
      provider: params.provider || ''
    };
    
    console.log('🔄 Regenerating with params:', regenParams);
    
    // Set regeneration parameters and switch to lab view
    setRegenerationParams(regenParams);
    setCurrentView('lab');
  };

  const handleNewCreature = (creature: any) => {
    saveCreatures([creature, ...creatures]);
  };
  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <>
          {/* Hero Section */}
          <div 
            className="relative min-h-screen flex items-center justify-center dna-pattern"
            style={{
              backgroundImage: `linear-gradient(rgba(34, 47, 62, 0.8), rgba(34, 47, 62, 0.9)), url(${labBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background"></div>
            
            <div className="absolute top-4 right-4 z-10">
              <ThemeSelector />
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div className="mb-8 flex items-center justify-center gap-4">
                <Dna className="w-16 h-16 text-primary animate-genetic-pulse" />
                <div>
                  <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
                    Createosaur
                  </h1>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl text-muted-foreground">
                      Genetic Engineering Laboratory
                    </p>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">
                      LIVE
                    </span>
                  </div>
                </div>
                <Beaker className="w-16 h-16 text-accent animate-genetic-pulse" />
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Welcome to the future of prehistoric genetics. Combine dinosaur DNA, 
                customize traits, and bring your ultimate hybrid creature to life 
                using cutting-edge AI visualization technology.
              </p>

              {/* API Key Notice */}
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Bring Your Own AI Key
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      To generate real creatures, you'll need your own free Hugging Face API key. 
                      Without it, you'll see demo mode with placeholder images.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="btn-genetic px-8 py-6 text-lg hover:scale-105 transition-transform"
                  onClick={() => setCurrentView('lab')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Enter the Lab
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="btn-lab px-8 py-6 text-lg"
                  onClick={() => {
                    console.log('Gallery button clicked, creatures:', creatures);
                    setCurrentView('gallery');
                  }}
                >
                  <Dna className="w-5 h-5 mr-2" />
                  View Gallery ({creatures.length})
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <div className="glass p-6 rounded-lg hover-glow">
                  <Dna className="w-8 h-8 text-primary mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold mb-2">DNA Mixing</h3>
                  <p className="text-sm text-muted-foreground">
                    Precise genetic engineering with percentage-based DNA combination
                  </p>
                </div>
                
                <div className="glass p-6 rounded-lg hover-glow">
                  <Beaker className="w-8 h-8 text-accent mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold mb-2">Custom Traits</h3>
                  <p className="text-sm text-muted-foreground">
                    Select specific features, colors, and patterns for your creation
                  </p>
                </div>
                
                <div className="glass p-6 rounded-lg hover-glow">
                  <Zap className="w-8 h-8 text-primary mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold mb-2">AI Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch your hybrid come to life through advanced visualization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {currentView === 'lab' && (
        <div className="relative">
          {/* Back Button */}
          <Button
            variant="outline"
            className="fixed top-4 left-4 z-50"
            onClick={() => {
              setCurrentView('home');
              setRegenerationParams(null); // Clear regeneration params when going back
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <GeneticLab 
            onNewCreature={handleNewCreature} 
            regenerationParams={regenerationParams}
          />
        </div>
      )}

      {currentView === 'gallery' && (
        <div className="min-h-screen dna-pattern">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={() => setCurrentView('home')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <Dna className="w-8 h-8 text-primary animate-genetic-pulse" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Creature Gallery
                </h1>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentView('lab')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>

            {/* Gallery Component */}
            <GenerationGallery
              creatures={creatures}
              onDeleteCreature={handleDeleteCreature}
              onToggleFavorite={handleToggleFavorite}
              onRateCreature={handleRateCreature}
              onRenameCreature={handleRenameCreature}
              onSelectCreature={handleSelectCreature}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
