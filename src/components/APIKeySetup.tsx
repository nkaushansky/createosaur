import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Key, Zap, Info, CheckCircle } from "lucide-react";
import { useState } from "react";

interface APIKeySetupProps {
  onClose?: () => void;
}

export function APIKeySetup({ onClose }: APIKeySetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Hugging Face API key",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage for development (in production, use secure storage)
    localStorage.setItem('VITE_HUGGINGFACE_API_KEY', apiKey);
    
    toast({
      title: "API Key Saved!",
      description: "Reload the page to enable real AI generation",
    });
    
    setStep(4);
  };

  const steps = [
    {
      title: "Visit Hugging Face",
      description: "Go to huggingface.co and create a free account",
      action: (
        <Button variant="outline" asChild>
          <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Sign Up Free
          </a>
        </Button>
      )
    },
    {
      title: "Get API Token",
      description: "Create a token with Inference API permissions (not just Read access)",
      action: (
        <div className="space-y-2">
          <Button variant="outline" asChild>
            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Get API Token
            </a>
          </Button>
          <Alert className="text-left">
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Select "Inference API" access level when creating your token, 
              not just "Read". Standard read tokens won't work for image generation.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "Enter API Key",
      description: "Paste your API key below to enable real AI generation",
      action: (
        <div className="space-y-3 w-full">
          <input
            type="password"
            placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          <Button onClick={handleSaveApiKey} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Save API Key
          </Button>
        </div>
      )
    },
    {
      title: "All Set!",
      description: "Your API key has been saved. Reload the page to start generating!",
      action: (
        <Button onClick={() => window.location.reload()} className="w-full">
          <Zap className="w-4 h-4 mr-2" />
          Reload & Generate
        </Button>
      )
    }
  ];

  return (
    <Card className="glass p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Enable Real AI Generation</h3>
      </div>
      
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex justify-between items-center">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                index + 1 <= step 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-1 ${
                  index + 1 < step ? 'bg-primary' : 'bg-secondary'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Current step */}
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">{steps[step - 1].title}</h4>
            <p className="text-sm text-muted-foreground">{steps[step - 1].description}</p>
          </div>
          
          <div className="flex flex-col items-center">
            {steps[step - 1].action}
          </div>
          
          {step < 4 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep(step + 1)}
              className="w-full"
            >
              Skip this step
            </Button>
          )}
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Currently using demo mode with placeholder creatures. 
            Add your API key for real AI-generated dinosaur hybrids!
          </AlertDescription>
        </Alert>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Continue with Demo Mode
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Demo mode banner component
 */
export function DemoModeBanner() {
  const [showSetup, setShowSetup] = useState(false);

  if (showSetup) {
    return <APIKeySetup onClose={() => setShowSetup(false)} />;
  }

  return (
    <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/20">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          <Badge variant="outline" className="mr-2">DEMO MODE</Badge>
          Using placeholder creatures. Get real AI generation with a free API key!
        </span>
        <Button size="sm" variant="outline" onClick={() => setShowSetup(true)}>
          <Key className="w-3 h-3 mr-1" />
          Setup API
        </Button>
      </AlertDescription>
    </Alert>
  );
}