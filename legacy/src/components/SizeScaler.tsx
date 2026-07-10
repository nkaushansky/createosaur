import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2 } from "lucide-react";

interface SizeScalerProps {
  size: number;
  onSizeChange: (size: number) => void;
}

const sizeLabels = [
  { value: 0, label: "Tiny", description: "House cat size", icon: Minimize2 },
  { value: 25, label: "Small", description: "Large dog size", icon: Minimize2 },
  { value: 50, label: "Medium", description: "Human size", icon: null },
  { value: 75, label: "Large", description: "Elephant size", icon: Maximize2 },
  { value: 100, label: "Massive", description: "Blue whale size", icon: Maximize2 },
];

export const SizeScaler = ({ size, onSizeChange }: SizeScalerProps) => {
  const getCurrentSizeInfo = () => {
    const closestSize = sizeLabels.reduce((prev, curr) => 
      Math.abs(curr.value - size) < Math.abs(prev.value - size) ? curr : prev
    );
    return closestSize;
  };

  const currentSize = getCurrentSizeInfo();
  const IconComponent = currentSize.icon;

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
        <h3 className="text-lg font-semibold">Size Genetics</h3>
        <Badge variant="outline" className="ml-auto">
          {currentSize.label}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Control the overall size scaling of your hybrid creature.
      </p>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-accent">Size Scale</label>
            <span className="text-sm text-muted-foreground">{size}%</span>
          </div>
          
          <Slider
            value={[size]}
            onValueChange={(value) => onSizeChange(value[0])}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tiny</span>
            <span>Medium</span>
            <span>Massive</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-accent">Size Reference</h4>
          <div className="bg-secondary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
              <span className="font-medium">{currentSize.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{currentSize.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {sizeLabels.map((sizeInfo) => (
            <button
              key={sizeInfo.value}
              onClick={() => onSizeChange(sizeInfo.value)}
              className={`p-2 text-xs rounded-lg border transition-all duration-200 ${
                Math.abs(size - sizeInfo.value) <= 5
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-secondary/20 border-border hover:bg-secondary/40"
              }`}
            >
              {sizeInfo.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};