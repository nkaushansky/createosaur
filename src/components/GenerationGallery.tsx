import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Grid, 
  Trash2, 
  Star, 
  Download, 
  Share2, 
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Zap,
  ImageIcon,
  Edit2,
  Check,
  X,
  Dna,
  Palette,
  Ruler,
  Clock,
  Tag
} from "lucide-react";

interface GeneratedCreature {
  id: string;
  name?: string;
  scientificName?: string;
  imageUrl: string;
  timestamp: Date;
  algorithm: string;
  rating?: number;
  isFavorite: boolean;
  tags: string[];
  generationParams: any;
}

interface GenerationGalleryProps {
  creatures: GeneratedCreature[];
  onDeleteCreature: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRateCreature: (id: string, rating: number) => void;
  onRenameCreature: (id: string, newName: string) => void;
  onSelectCreature: (creature: GeneratedCreature) => void;
  onRegenerate: (params: any) => void;
}

export const GenerationGallery = ({
  creatures,
  onDeleteCreature,
  onToggleFavorite,
  onRateCreature,
  onRenameCreature,
  onSelectCreature,
  onRegenerate
}: GenerationGalleryProps) => {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedCreatures, setSelectedCreatures] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingCreature, setEditingCreature] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedCreature, setSelectedCreature] = useState<GeneratedCreature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCreatures = creatures.filter(creature => {
    const matchesSearch = !searchTerm || 
      creature.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creature.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creature.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterBy === "all" || 
      (filterBy === "favorites" && creature.isFavorite) ||
      (filterBy === "recent" && isRecent(new Date(creature.timestamp))) ||
      creature.algorithm === filterBy;

    return matchesSearch && matchesFilter;
  });

  const sortedCreatures = [...filteredCreatures].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case "oldest":
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  const isRecent = (timestamp: Date) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return timestamp > oneDayAgo;
  };

  const toggleCreatureSelection = (id: string) => {
    setSelectedCreatures(prev =>
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = useCallback(() => {
    selectedCreatures.forEach(id => onDeleteCreature(id));
    setSelectedCreatures([]);
    toast({
      title: "Creatures Deleted",
      description: `Removed ${selectedCreatures.length} creature${selectedCreatures.length > 1 ? 's' : ''}`,
    });
  }, [selectedCreatures, onDeleteCreature, toast]);

  const handleBulkFavorite = useCallback(() => {
    selectedCreatures.forEach(id => onToggleFavorite(id));
    setSelectedCreatures([]);
    toast({
      title: "Favorites Updated",
      description: `Updated ${selectedCreatures.length} creature${selectedCreatures.length > 1 ? 's' : ''}`,
    });
  }, [selectedCreatures, onToggleFavorite, toast]);

  const startEditing = useCallback((creatureId: string, currentName: string) => {
    setEditingCreature(creatureId);
    setEditingName(currentName || "");
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCreature(null);
    setEditingName("");
  }, []);

  const saveRename = useCallback((creatureId: string) => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== creatures.find(c => c.id === creatureId)?.name) {
      onRenameCreature(creatureId, trimmedName);
      toast({
        title: "Creature Renamed",
        description: `Successfully renamed to "${trimmedName}"`,
      });
    }
    setEditingCreature(null);
    setEditingName("");
  }, [editingName, creatures, onRenameCreature, toast]);

  const openCreatureModal = useCallback((creature: GeneratedCreature) => {
    setSelectedCreature(creature);
    setIsModalOpen(true);
  }, []);

  const closeCreatureModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCreature(null);
    setEditingCreature(null);
    setEditingName("");
  }, []);

  const renderCreatureCard = (creature: GeneratedCreature) => (
    <Card 
      key={creature.id} 
      className={`glass overflow-hidden cursor-pointer transition-all hover:scale-105 ${
        selectedCreatures.includes(creature.id) ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => openCreatureModal(creature)}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={creature.imageUrl} 
          alt={creature.name || "Generated creature"}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(creature.id);
            }}
          >
            <Star className={`w-4 h-4 ${creature.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate(creature.generationParams);
            }}
          >
            <Zap className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              toggleCreatureSelection(creature.id);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Selection Checkbox */}
        <div 
          className="absolute top-2 left-2"
          onClick={(e) => {
            e.stopPropagation();
            toggleCreatureSelection(creature.id);
          }}
        >
          <div className={`w-6 h-6 rounded border-2 border-white flex items-center justify-center ${
            selectedCreatures.includes(creature.id) ? 'bg-primary' : 'bg-black/50'
          }`}>
            {selectedCreatures.includes(creature.id) && (
              <span className="text-white text-xs">✓</span>
            )}
          </div>
        </div>

        {/* Favorite Star */}
        {creature.isFavorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">
              {creature.name || "Unnamed Creature"}
            </h4>
            {creature.scientificName && (
              <p className="text-sm text-muted-foreground italic truncate">
                {creature.scientificName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(creature.timestamp).toLocaleDateString()}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {creature.algorithm}
          </Badge>
        </div>

        {/* Tags */}
        {creature.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {creature.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {creature.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{creature.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Rating */}
        {creature.rating && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-3 h-3 cursor-pointer ${
                  star <= creature.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRateCreature(creature.id, star);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <>
      <Card className="glass p-6">
        <div className="flex items-center gap-2 mb-6">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Generation Gallery</h3>
          <Badge variant="outline" className="ml-auto">
            {creatures.length} creature{creatures.length !== 1 ? 's' : ''}
          </Badge>
        </div>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        {/* Search and Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search creatures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="genetic">Genetic</SelectItem>
              <SelectItem value="evolutionary">Evolutionary</SelectItem>
              <SelectItem value="neural">Neural</SelectItem>
              <SelectItem value="chaos">Chaos</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedCreatures.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedCreatures.length} selected
            </span>
            <Button size="sm" variant="outline" onClick={handleBulkFavorite}>
              <Star className="w-4 h-4 mr-1" />
              Toggle Favorite
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSelectedCreatures([])}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Gallery */}
      {sortedCreatures.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">No creatures found</h4>
          <p className="text-muted-foreground">
            {creatures.length === 0 
              ? "Generate your first creature to start building your collection"
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      ) : (
        <div className={`${
          viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
            : "space-y-4"
        }`}>
          {sortedCreatures.map(renderCreatureCard)}
        </div>
      )}
    </Card>

    {/* Creature Detail Modal */}
    <Dialog open={isModalOpen} onOpenChange={closeCreatureModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {selectedCreature && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-primary" />
                Creature Details
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Image and Basic Info */}
              <div className="space-y-4">
                {/* Large Image */}
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedCreature.imageUrl} 
                    alt={selectedCreature.name || "Generated creature"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name Editing */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit2 className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">Creature Name</Label>
                  </div>
                  {editingCreature === selectedCreature.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveRename(selectedCreature.id);
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                        placeholder="Enter creature name"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => saveRename(selectedCreature.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedCreature.name || "Unnamed Creature"}</p>
                        {selectedCreature.scientificName && (
                          <p className="text-sm text-muted-foreground italic">
                            {selectedCreature.scientificName}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(selectedCreature.id, selectedCreature.name || "")}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onToggleFavorite(selectedCreature.id)}
                    className="flex-1"
                  >
                    <Star className={`w-4 h-4 mr-2 ${selectedCreature.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {selectedCreature.isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onRegenerate(selectedCreature.generationParams);
                      closeCreatureModal();
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Right Column - Genetic Information */}
              <div className="space-y-4">
                {/* Genetic Composition */}
                {selectedCreature.generationParams?.dinosaurs && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Dna className="w-4 h-4 text-primary" />
                      <h4 className="font-medium">Genetic Composition</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedCreature.generationParams.dinosaurs.map((dino: any) => (
                        <div key={dino.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium text-sm">{dino.name}</p>
                            <p className="text-xs text-muted-foreground italic">{dino.scientificName}</p>
                          </div>
                          <Badge variant="outline">{dino.percentage}%</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Visual Traits */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Visual Traits</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedCreature.generationParams?.selectedColors && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Colors</Label>
                        <div className="flex gap-1 mt-1">
                          {selectedCreature.generationParams.selectedColors.map((color: string, index: number) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedCreature.generationParams?.selectedPattern && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Pattern</Label>
                        <Badge variant="secondary" className="ml-2 capitalize">
                          {selectedCreature.generationParams.selectedPattern}
                        </Badge>
                      </div>
                    )}
                    {selectedCreature.generationParams?.selectedTexture && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Texture</Label>
                        <Badge variant="secondary" className="ml-2 capitalize">
                          {selectedCreature.generationParams.selectedTexture}
                        </Badge>
                      </div>
                    )}
                    {selectedCreature.generationParams?.creatureSize && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Ruler className="w-4 h-4" />
                          <span className="text-sm">{selectedCreature.generationParams.creatureSize}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Generation Info */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">Generation Details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(selectedCreature.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <Badge variant="outline">{selectedCreature.algorithm}</Badge>
                    </div>
                    {selectedCreature.rating && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 cursor-pointer ${
                                star <= selectedCreature.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                              }`}
                              onClick={() => onRateCreature(selectedCreature.id, star)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Tags */}
                {selectedCreature.tags?.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-primary" />
                      <h4 className="font-medium">Tags</h4>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {selectedCreature.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};