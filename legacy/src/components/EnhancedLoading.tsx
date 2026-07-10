import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dna, Zap, Beaker, Brain, X } from "lucide-react";

interface AIGenerationLoadingProps {
  stage: string;
  progress: number;
  subtext?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  batchSize?: number;
  currentItem?: number;
  estimatedTime?: number;
}

const stageIcons = {
  'Analyzing': Dna,
  'Sequencing': Beaker,
  'Generating': Brain,
  'Finalizing': Zap,
  'Complete': Zap
};

const stageDescriptions = {
  'Analyzing': 'Analyzing DNA sequences and trait compatibility...',
  'Sequencing': 'Building genetic blueprint and trait mapping...',
  'Generating': 'Creating hybrid creature with AI image generation...',
  'Finalizing': 'Processing final image and metadata...',
  'Complete': 'Generation complete!'
};

export function AIGenerationLoading({
  stage,
  progress,
  subtext,
  showCancel = false,
  onCancel,
  batchSize = 1,
  currentItem = 1,
  estimatedTime
}: AIGenerationLoadingProps) {
  const IconComponent = stageIcons[stage as keyof typeof stageIcons] || Dna;
  const description = stageDescriptions[stage as keyof typeof stageDescriptions] || subtext || 'Processing...';
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="glass p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Animated Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <IconComponent className="w-8 h-8 text-primary animate-genetic-pulse" />
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary/30 animate-spin" style={{
            animationDuration: '3s'
          }} />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Badge variant="outline" className="bg-primary/10 border-primary/20">
              {stage}
            </Badge>
            {batchSize > 1 && (
              <Badge variant="outline" className="bg-secondary/10">
                {currentItem}/{batchSize}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-bold">Genetic Engineering in Progress</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </div>

        {/* Batch Progress */}
        {batchSize > 1 && (
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Batch Progress</span>
              <span>{currentItem}/{batchSize}</span>
            </div>
            <Progress value={(currentItem / batchSize) * 100} className="w-full h-1" />
          </div>
        )}

        {/* Estimated Time */}
        {estimatedTime && estimatedTime > 0 && (
          <div className="text-xs text-muted-foreground">
            Estimated time remaining: {formatTime(estimatedTime)}
          </div>
        )}

        {/* Cancel Button */}
        {showCancel && onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Generation
          </Button>
        )}

        {/* DNA Animation */}
        <div className="flex space-x-1 opacity-50">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-8 bg-primary/30 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Simple loading spinner for quick operations
 */
export function GenerationSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary/30 border-t-primary`} />
  );
}

/**
 * Generation status badge
 */
interface GenerationStatusProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  message?: string;
}

export function GenerationStatus({ status, message }: GenerationStatusProps) {
  const statusConfig = {
    idle: {
      color: 'bg-secondary/10 border-secondary/20 text-secondary-foreground',
      icon: Dna,
      text: 'Ready to Generate'
    },
    generating: {
      color: 'bg-primary/10 border-primary/20 text-primary',
      icon: Brain,
      text: 'Generating...'
    },
    success: {
      color: 'bg-green-500/10 border-green-500/20 text-green-600',
      icon: Zap,
      text: 'Generation Complete'
    },
    error: {
      color: 'bg-destructive/10 border-destructive/20 text-destructive',
      icon: X,
      text: 'Generation Failed'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={config.color}>
      <IconComponent className="w-3 h-3 mr-1" />
      {message || config.text}
    </Badge>
  );
}