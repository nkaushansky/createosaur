import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Share2, 
  Search, 
  Filter, 
  Calendar,
  User,
  Globe,
  Sparkles,
  Eye
} from 'lucide-react';
import { CreatureService, DatabaseCreature } from '@/services/creatureService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CommunityGalleryProps {
  onCreatureInspire?: (creature: DatabaseCreature) => void;
}

export const CommunityGallery = ({ onCreatureInspire }: CommunityGalleryProps) => {
  const [creatures, setCreatures] = useState<DatabaseCreature[]>([]);
  const [filteredCreatures, setFilteredCreatures] = useState<DatabaseCreature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const { toast } = useToast();
  const { user } = useAuth();

  // Load public creatures
  useEffect(() => {
    const loadPublicCreatures = async () => {
      try {
        setLoading(true);
        const publicCreatures = await CreatureService.getPublicCreatures();
        setCreatures(publicCreatures);
        setFilteredCreatures(publicCreatures);
      } catch (error) {
        console.error('Failed to load public creatures:', error);
        toast({
          title: "Failed to Load Gallery",
          description: "Unable to load community creatures. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPublicCreatures();
  }, [toast]);

  // Filter and sort creatures
  useEffect(() => {
    let filtered = creatures.filter(creature =>
      creature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(creature.traits).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort creatures
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredCreatures(filtered);
  }, [creatures, searchTerm, sortBy]);

  const handleInspire = (creature: DatabaseCreature) => {
    onCreatureInspire?.(creature);
    toast({
      title: "Creature Loaded!",
      description: `Using "${creature.name}" as inspiration for your next creation.`,
    });
  };

  const handleShare = async (creature: DatabaseCreature) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this creature: ${creature.name}`,
          text: `Amazing hybrid creature created with Createosaur!`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Gallery link copied to clipboard.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTraitDisplayName = (trait: string) => {
    return trait.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading community creatures...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Community Gallery</h2>
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover amazing hybrid creatures created by the Createosaur community. 
          Get inspired and use these creations as a starting point for your own experiments!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{creatures.length} public creatures</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creatures, traits, or species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-input rounded-md px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredCreatures.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Globe className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No creatures match your search' : 'No public creatures yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all creatures.'
                : 'Be the first to share a creature with the community!'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreatures.map((creature) => (
            <Card key={creature.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Creature Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {creature.image_url ? (
                    <img
                      src={creature.image_url}
                      alt={creature.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleInspire(creature)}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Inspire Me
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleShare(creature)}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Creature Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {creature.name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(creature.created_at)}</span>
                    </div>
                  </div>

                  {/* Traits */}
                  {creature.traits && typeof creature.traits === 'object' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(creature.traits).slice(0, 3).map(([key, value], index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getTraitDisplayName(key)}
                          </Badge>
                        ))}
                        {Object.keys(creature.traits).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(creature.traits).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {creature.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Heart
                          key={i}
                          className={`h-4 w-4 ${
                            i < creature.rating! 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};