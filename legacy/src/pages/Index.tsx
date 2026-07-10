import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatures } from "@/hooks/useCreatures";
import { GeneticLab } from "@/components/GeneticLab";
import { GenerationGallery } from "@/components/GenerationGallery";
import { AuthForm } from "@/components/AuthForm";
import { UserProfile } from "@/components/UserProfile";
import { FreeTrialStatus } from "@/components/FreeTrialStatus";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dna, Beaker, Zap, ArrowLeft, User, LogIn, Cloud, Upload } from "lucide-react";
import labBackground from "@/assets/lab-background.jpg";

const Index = () => {
  const { user, loading } = useAuth();
  const { 
    creatures, 
    loading: creaturesLoading, 
    error: creaturesError,
    migrationStatus,
    actions: {
      saveCreature,
      deleteCreature,
      toggleFavorite,
      updateRating,
      renameCreature,
      togglePublic
    }
  } = useCreatures();
  
  const [currentView, setCurrentView] = useState<'home' | 'lab' | 'gallery'>('home');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [regenerationParams, setRegenerationParams] = useState<any>(null);

  const handleUpgradeAction = (action: 'signup' | 'api-key' | 'credits') => {
    switch (action) {
      case 'signup':
        setShowAuthDialog(true);
        break;
      case 'api-key':
        setShowAuthDialog(true); // For now, redirect to auth - later we'll have API key setup
        break;
      case 'credits':
        // TODO: Implement credit purchase flow
        console.log('Credit purchase not yet implemented');
        break;
    }
  };

  // Convert database creatures to the format expected by GenerationGallery
  const adaptedCreatures = creatures.map(creature => ({
    id: creature.id,
    name: creature.name,
    imageUrl: creature.image_url || '',
    timestamp: new Date(creature.created_at),
    algorithm: creature.generation_params?.algorithm || 'unknown',
    generationParams: creature.generation_params,
    traits: creature.traits,
    isFavorite: creature.is_favorite,
    rating: creature.rating,
    tags: [] // Add empty tags array for compatibility
  }));

  const handleDeleteCreature = async (id: string) => {
    await deleteCreature(id);
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
  };

  const handleRateCreature = async (id: string, rating: number) => {
    await updateRating(id, rating);
  };

  const handleRenameCreature = async (id: string, newName: string) => {
    await renameCreature(id, newName);
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

  const handleNewCreature = async (creature: any) => {
    await saveCreature({
      name: creature.name || 'Unnamed Creature',
      image_url: creature.imageUrl,
      generation_params: creature.generationParams || {},
      traits: creature.traits || {},
      is_favorite: creature.isFavorite || false,
      is_public: false,
      // Only include rating if it's a valid number between 1-5
      ...(creature.rating && creature.rating >= 1 && creature.rating <= 5 
          ? { rating: creature.rating } 
          : {})
    });
  };
  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <>
          {/* Hero Section */}
          <div 
            className="relative min-h-screen flex items-center justify-center dna-pattern px-4 sm:px-6 lg:px-8"
            style={{
              backgroundImage: `linear-gradient(rgba(34, 47, 62, 0.8), rgba(34, 47, 62, 0.9)), url(${labBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background"></div>
            
            {/* Mobile-friendly header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Dna className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <span className="text-lg sm:text-xl font-bold text-white">Createosaur</span>
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfileDialog(true)}
                      className="bg-background/80 backdrop-blur-sm flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAuthDialog(true)}
                      className="bg-background/80 backdrop-blur-sm flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  )}
                  <ThemeSelector />
                </div>
              </div>
              
              {/* Free Trial Status for Anonymous Users */}
              {!user && (
                <div className="mt-4">
                  <FreeTrialStatus 
                    onUpgradeAction={handleUpgradeAction}
                    className="bg-background/90 backdrop-blur-sm"
                  />
                </div>
              )}
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20 sm:pt-24">
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Dna className="w-12 h-12 sm:w-16 sm:h-16 text-primary animate-genetic-pulse" />
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
                    Createosaur
                  </h1>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg sm:text-xl text-muted-foreground">
                      Genetic Engineering Laboratory
                    </p>
                  </div>
                </div>
                <Beaker className="w-12 h-12 sm:w-16 sm:h-16 text-accent animate-genetic-pulse" />
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Welcome to the future of prehistoric genetics. Combine dinosaur DNA, 
                customize traits, and bring your ultimate hybrid creature to life 
                using cutting-edge AI visualization technology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="btn-genetic w-full sm:w-auto px-8 py-6 text-lg hover:scale-105 transition-transform"
                  onClick={() => setCurrentView('lab')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Enter the Lab
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="btn-lab w-full sm:w-auto px-8 py-6 text-lg"
                  onClick={() => {
                    console.log('Gallery button clicked, creatures:', creatures);
                    setCurrentView('gallery');
                  }}
                >
                  <Dna className="w-5 h-5 mr-2" />
                  View Gallery ({creatures.length})
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 px-4">
                <div className="glass p-4 sm:p-6 rounded-lg hover-glow">
                  <Dna className="w-8 h-8 text-primary mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold mb-2">DNA Mixing</h3>
                  <p className="text-sm text-muted-foreground">
                    Precise genetic engineering with percentage-based DNA combination
                  </p>
                </div>
                
                <div className="glass p-4 sm:p-6 rounded-lg hover-glow">
                  <Beaker className="w-8 h-8 text-accent mb-3 mx-auto" />
                  <h3 className="text-lg font-semibold mb-2">Custom Traits</h3>
                  <p className="text-sm text-muted-foreground">
                    Select specific features, colors, and patterns for your creation
                  </p>
                </div>
                
                <div className="glass p-4 sm:p-6 rounded-lg hover-glow sm:col-span-2 lg:col-span-1">
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
          {/* Mobile-friendly Back Button */}
          <Button
            variant="outline"
            size="sm"
            className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setCurrentView('home');
              setRegenerationParams(null); // Clear regeneration params when going back
            }}
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
          <GeneticLab 
            onNewCreature={handleNewCreature} 
            regenerationParams={regenerationParams}
          />
        </div>
      )}

      {currentView === 'gallery' && (
        <div className="min-h-screen dna-pattern">
          <div className="container mx-auto px-4 py-4 sm:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>

                <h1 className="text-xl sm:text-3xl font-bold">My Creatures</h1>
              </div>
              
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="w-4 h-4" />
                  <span className="hidden sm:inline">Cloud Sync Enabled</span>
                  <span className="sm:hidden">Synced</span>
                </div>
              )}
            </div>

            {/* Migration Status */}
            {migrationStatus.completed && migrationStatus.migratedCount > 0 && (
              <Alert className="mb-6">
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  Successfully migrated {migrationStatus.migratedCount} creatures from local storage to your cloud gallery!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {creaturesError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  {creaturesError}
                </AlertDescription>
              </Alert>
            )}

            {/* Auth Required Notice */}
            {!user && (
              <Alert className="mb-6">
                <LogIn className="h-4 w-4" />
                <AlertDescription>
                  Sign in to save your creatures to the cloud and access them from any device!
                </AlertDescription>
              </Alert>
            )}

            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-8">
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
              creatures={adaptedCreatures}
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

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <AuthForm onSuccess={() => setShowAuthDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-2xl">
          <UserProfile onClose={() => setShowProfileDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
