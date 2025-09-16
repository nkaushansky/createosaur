import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Dna, Zap, Beaker, Sparkles } from 'lucide-react';

interface AdvancedLoadingProps {
  stage: string;
  progress: number;
  subtext?: string;
}

export const AdvancedLoading = ({ stage, progress, subtext }: AdvancedLoadingProps) => {
  const getStageIcon = () => {
    switch (stage.toLowerCase()) {
      case 'analyzing':
        return <Dna className="w-6 h-6 text-primary animate-genetic-pulse" />;
      case 'sequencing':
        return <Beaker className="w-6 h-6 text-accent animate-genetic-pulse" />;
      case 'generating':
        return <Zap className="w-6 h-6 text-primary animate-genetic-pulse" />;
      case 'finalizing':
        return <Sparkles className="w-6 h-6 text-accent animate-genetic-pulse" />;
      default:
        return <Dna className="w-6 h-6 text-primary animate-genetic-pulse" />;
    }
  };

  return (
    <Card className="glass p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {getStageIcon()}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-1">{stage} DNA...</h3>
          {subtext && (
            <p className="text-sm text-muted-foreground">{subtext}</p>
          )}
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
        </div>

        <div className="dna-strand h-1 bg-secondary/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent opacity-60" />
        </div>
      </div>
    </Card>
  );
};

interface QuickLoadingProps {
  text?: string;
}

export const QuickLoading = ({ text = "Processing..." }: QuickLoadingProps) => {
  return (
    <div className="flex items-center gap-3 p-4">
      <Dna className="w-5 h-5 text-primary animate-genetic-pulse" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className = "" }: SkeletonCardProps) => {
  return (
    <Card className={`glass p-4 animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="h-4 bg-secondary/30 rounded w-3/4" />
        <div className="h-3 bg-secondary/20 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-2 bg-secondary/20 rounded" />
          <div className="h-2 bg-secondary/20 rounded w-5/6" />
        </div>
      </div>
    </Card>
  );
};