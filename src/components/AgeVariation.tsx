import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Baby, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeVariationProps {
  ageStage: 'juvenile' | 'adult';
  onAgeStageChange: (stage: 'juvenile' | 'adult') => void;
}

const ageStages = [
  {
    id: 'juvenile' as const,
    name: 'Juvenile',
    icon: Baby,
    description: 'Young, smaller, more playful features',
    characteristics: ['Larger eyes', 'Softer features', 'Brighter colors', 'Smaller size']
  },
  {
    id: 'adult' as const,
    name: 'Adult',
    icon: User,
    description: 'Mature, full-sized, developed features',
    characteristics: ['Pronounced features', 'Battle scars', 'Dominant colors', 'Full size']
  }
];

export const AgeVariation = ({ ageStage, onAgeStageChange }: AgeVariationProps) => {
  const currentStage = ageStages.find(stage => stage.id === ageStage) || ageStages[1];

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <currentStage.icon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Age Genetics</h3>
        <Badge variant="outline" className="ml-auto">
          {currentStage.name}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Select the developmental stage for your hybrid's appearance and behavior.
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {ageStages.map((stage) => {
            const IconComponent = stage.icon;
            return (
              <Button
                key={stage.id}
                variant="outline"
                className={cn(
                  "flex flex-col items-center gap-3 h-auto p-4 btn-lab",
                  ageStage === stage.id && "ring-2 ring-primary glow-primary bg-primary/10"
                )}
                onClick={() => onAgeStageChange(stage.id)}
              >
                <IconComponent className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-medium">{stage.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stage.description}</div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-accent">Stage Characteristics</h4>
          <div className="bg-secondary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <currentStage.icon className="w-4 h-4 text-primary" />
              <span className="font-medium">{currentStage.name} Features</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currentStage.characteristics.map((characteristic, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {characteristic}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};