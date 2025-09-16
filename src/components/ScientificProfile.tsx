import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Users, Clock, Zap, TreePine, Mountain, Waves, Sun } from "lucide-react";
import { BehavioralProfile } from "@/utils/BehavioralSimulator";
import { ScientificName } from "@/utils/ScientificNameGenerator";

interface ScientificProfileProps {
  behavioralProfile: BehavioralProfile;
  scientificName: ScientificName;
}

export const ScientificProfile = ({ behavioralProfile, scientificName }: ScientificProfileProps) => {
  const getTemperamentColor = (temperament: string) => {
    switch (temperament) {
      case 'aggressive': return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'territorial': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'social': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'curious': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      default: return 'bg-green-500/20 text-green-700 dark:text-green-300';
    }
  };

  const getActivityIcon = (pattern: string) => {
    switch (pattern) {
      case 'diurnal': return <Sun className="w-4 h-4" />;
      case 'nocturnal': return <div className="w-4 h-4 rounded-full bg-gray-700" />;
      case 'crepuscular': return <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getHabitatIcon = (environment: string) => {
    if (environment.toLowerCase().includes('forest')) return <TreePine className="w-4 h-4" />;
    if (environment.toLowerCase().includes('mountain') || environment.toLowerCase().includes('rocky')) return <Mountain className="w-4 h-4" />;
    if (environment.toLowerCase().includes('water') || environment.toLowerCase().includes('wetland')) return <Waves className="w-4 h-4" />;
    return <TreePine className="w-4 h-4" />;
  };

  const getTrophicLevelColor = (level: string) => {
    switch (level) {
      case 'apex_predator': return 'bg-red-600 text-white';
      case 'carnivore': return 'bg-red-500 text-white';
      case 'omnivore': return 'bg-yellow-500 text-white';
      case 'herbivore': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Scientific Profile</h3>
      </div>

      <Tabs defaultValue="behavior" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="behavior" className="text-xs">Behavior</TabsTrigger>
          <TabsTrigger value="taxonomy" className="text-xs">Taxonomy</TabsTrigger>
          <TabsTrigger value="habitat" className="text-xs">Habitat</TabsTrigger>
          <TabsTrigger value="ecology" className="text-xs">Ecology</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Intelligence
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cognitive Level</span>
                    <span className="text-sm font-medium">{behavioralProfile.intelligence}%</span>
                  </div>
                  <Progress value={behavioralProfile.intelligence} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                  {getActivityIcon(behavioralProfile.activityPattern)}
                  Activity
                </h4>
                <Badge variant="outline" className="w-full justify-center">
                  {behavioralProfile.activityPattern}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent">Temperament</h4>
              <Badge className={getTemperamentColor(behavioralProfile.temperament)}>
                {behavioralProfile.temperament}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                <Users className="w-4 h-4" />
                Social Structure
              </h4>
              <p className="text-sm text-muted-foreground bg-secondary/20 rounded-lg p-3">
                {behavioralProfile.socialStructure}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent">Personality Traits</h4>
              <div className="space-y-2">
                {behavioralProfile.personality.map((trait, index) => (
                  <div key={index} className="bg-secondary/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{trait.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {trait.intensity}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{trait.description}</p>
                    <Progress value={trait.intensity} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-4">
          <div className="space-y-4">
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <h4 className="text-lg font-bold italic text-primary mb-2">
                {scientificName.fullName}
              </h4>
              <p className="text-sm text-muted-foreground">
                Genetically Engineered Hybrid Species
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-accent">Classification</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(scientificName.classification).map(([rank, value]) => (
                  <div key={rank} className="flex justify-between p-2 bg-secondary/10 rounded">
                    <span className="font-medium capitalize">{rank}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent">Etymology</h4>
              <p className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3 leading-relaxed">
                {scientificName.etymology}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="habitat" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-accent">Habitat Preferences</h4>
            <div className="space-y-3">
              {behavioralProfile.habitatPreferences.map((habitat, index) => (
                <div key={index} className="bg-secondary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getHabitatIcon(habitat.environment)}
                      <span className="font-medium text-sm">{habitat.environment}</span>
                    </div>
                    <Badge variant="outline">
                      {habitat.suitability}% suitable
                    </Badge>
                  </div>
                  <Progress value={habitat.suitability} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{habitat.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ecology" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent">Ecosystem Role</h4>
              <div className="bg-secondary/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trophic Level:</span>
                  <Badge className={getTrophicLevelColor(behavioralProfile.ecosystemRole.trophicLevel)}>
                    {behavioralProfile.ecosystemRole.trophicLevel.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm font-medium">Ecological Niche:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {behavioralProfile.ecosystemRole.niche}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium">Ecosystem Impact:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {behavioralProfile.ecosystemRole.impact}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-accent">Species Interactions</h4>
              <div className="space-y-2">
                {behavioralProfile.ecosystemRole.interactions.map((interaction, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-secondary/10 rounded">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{interaction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};