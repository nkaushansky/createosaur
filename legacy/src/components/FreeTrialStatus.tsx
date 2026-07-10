import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Gift, 
  Key, 
  CreditCard, 
  UserPlus, 
  Sparkles,
  Clock,
  ArrowRight 
} from 'lucide-react';
import { AnonymousGenerationService } from '@/services/anonymousGenerationService';

interface FreeTrialStatusProps {
  onUpgradeAction: (action: 'signup' | 'api-key' | 'credits') => void;
  className?: string;
}

export const FreeTrialStatus = ({ onUpgradeAction, className }: FreeTrialStatusProps) => {
  const [trialInfo, setTrialInfo] = useState(AnonymousGenerationService.getTrialInfo());
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    // Update trial info
    const info = AnonymousGenerationService.getTrialInfo();
    setTrialInfo(info);
    setShowUpgrade(AnonymousGenerationService.shouldShowUpgrade());
  }, []);

  const progressPercentage = trialInfo.remainingGenerations === 0 
    ? 100 
    : ((3 - trialInfo.remainingGenerations) / 3) * 100;

  const getStatusColor = () => {
    if (trialInfo.remainingGenerations === 0) return 'destructive';
    if (trialInfo.remainingGenerations === 1) return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (trialInfo.remainingGenerations === 0) return <Clock className="w-4 h-4" />;
    if (trialInfo.remainingGenerations === 1) return <Zap className="w-4 h-4" />;
    return <Gift className="w-4 h-4" />;
  };

  if (!showUpgrade && trialInfo.remainingGenerations > 1) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Free Trial</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {trialInfo.remainingGenerations} left
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowUpgrade(true)}
            className="text-xs"
          >
            See options
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <h3 className="font-semibold">
              {trialInfo.remainingGenerations === 0 ? 'Trial Complete' : 'Free Trial'}
            </h3>
          </div>
          <Badge variant={getStatusColor() as any}>
            {trialInfo.remainingGenerations} remaining
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Generations used</span>
            <span>{3 - trialInfo.remainingGenerations}/3</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Message */}
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription>
            {trialInfo.conversionMessage}
          </AlertDescription>
        </Alert>

        {/* Upgrade Options */}
        {showUpgrade && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Continue Creating:</h4>
            {AnonymousGenerationService.getUpgradeOptions().map((option, index) => (
              <Button
                key={option.action}
                variant={index === 0 ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => onUpgradeAction(option.action)}
              >
                <div className="flex items-center gap-2">
                  {option.action === 'signup' && <UserPlus className="w-4 h-4" />}
                  {option.action === 'api-key' && <Key className="w-4 h-4" />}
                  {option.action === 'credits' && <CreditCard className="w-4 h-4" />}
                  <div className="text-left">
                    <div className="font-medium">{option.title}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        )}

        {/* Collapse option */}
        {showUpgrade && trialInfo.remainingGenerations > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowUpgrade(false)}
            className="w-full text-xs"
          >
            Continue with trial ({trialInfo.remainingGenerations} left)
          </Button>
        )}
      </div>
    </Card>
  );
};