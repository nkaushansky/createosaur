import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Key, 
  Save, 
  Trash2, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Cloud,
  Cpu
} from "lucide-react";
import { aiProviderRegistry } from '@/services/providers';

interface SettingsProps {
  onApiKeyChange?: () => void;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: typeof Zap;
  keyPrefix: string;
  storageKey: string;
  description: string;
  setupUrl: string;
  setupInstructions: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'huggingface',
    name: 'Hugging Face',
    icon: Cpu,
    keyPrefix: 'hf_',
    storageKey: 'VITE_HUGGINGFACE_API_KEY',
    description: 'Free AI models including Stable Diffusion variants',
    setupUrl: 'https://huggingface.co/settings/tokens',
    setupInstructions: [
      'Go to Hugging Face Token Settings',
      'Click "New token"',
      'Select "Inference API" access level (not just "Read")',
      'Copy the token and paste it below'
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Zap,
    keyPrefix: 'sk-',
    storageKey: 'VITE_OPENAI_API_KEY',
    description: 'Premium DALL-E 3 & DALL-E 2 models',
    setupUrl: 'https://platform.openai.com/api-keys',
    setupInstructions: [
      'Go to OpenAI Platform API Keys',
      'Click "Create new secret key"',
      'Copy the key immediately (it won\'t be shown again)',
      'Paste it below'
    ]
  },
  {
    id: 'stability',
    name: 'Stability AI',
    icon: Cloud,
    keyPrefix: 'sk-',
    storageKey: 'VITE_STABILITY_API_KEY',
    description: 'High-quality Stable Diffusion models',
    setupUrl: 'https://platform.stability.ai/account/keys',
    setupInstructions: [
      'Go to Stability AI Platform',
      'Navigate to Account > API Keys',
      'Click "Create API Key"',
      'Copy the key and paste it below'
    ]
  }
];

export function Settings({ onApiKeyChange }: SettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState(() => {
    return aiProviderRegistry.getDefaultProviderName();
  });
  const [apiKeys, setApiKeys] = useState(() => {
    const keys: Record<string, string> = {};
    PROVIDERS.forEach(provider => {
      keys[provider.id] = localStorage.getItem(provider.storageKey) || '';
    });
    return keys;
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const handleSaveApiKey = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    const apiKey = apiKeys[providerId];
    
    if (!provider || !apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: `Please enter a valid ${provider?.name} API key`,
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith(provider.keyPrefix)) {
      toast({
        title: "Invalid API Key Format",
        description: `${provider.name} API keys should start with '${provider.keyPrefix}'`,
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem(provider.storageKey, apiKey);
    
    toast({
      title: "API Key Saved!",
      description: `Your ${provider.name} API key has been updated.`,
    });

    onApiKeyChange?.();
  };

  const handleRemoveApiKey = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    localStorage.removeItem(provider.storageKey);
    setApiKeys(prev => ({ ...prev, [providerId]: '' }));
    
    toast({
      title: "API Key Removed",
      description: `Your ${provider.name} API key has been removed.`,
    });

    onApiKeyChange?.();
  };

  const handleSavePreferredProvider = () => {
    const success = aiProviderRegistry.setDefaultProvider(preferredProvider);
    if (success) {
      toast({
        title: "Preferences Saved",
        description: `${PROVIDERS.find(p => p.id === preferredProvider)?.name} set as preferred provider.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to set preferred provider.",
        variant: "destructive"
      });
    }
  };

  const getProviderStatus = (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    const apiKey = localStorage.getItem(provider?.storageKey || '');
    return Boolean(apiKey);
  };

  const configuredProviders = PROVIDERS.filter(p => getProviderStatus(p.id));
  const hasAnyProvider = configuredProviders.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Createosaur Settings
          </DialogTitle>
          <DialogDescription>
            Manage your AI providers, API keys, and application preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">AI Providers</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Provider Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  AI Provider Status
                </CardTitle>
                <CardDescription>
                  Configure multiple AI providers for image generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {configuredProviders.length > 0 ? (
                    configuredProviders.map(provider => (
                      <Badge key={provider.id} variant="default" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {provider.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">Demo Mode - No AI Providers</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Individual Provider Cards */}
            {PROVIDERS.map(provider => {
              const IconComponent = provider.icon;
              const isConfigured = getProviderStatus(provider.id);
              const currentKey = localStorage.getItem(provider.storageKey);
              const showKey = showApiKeys[provider.id] || false;
              
              return (
                <Card key={provider.id} className={isConfigured ? "border-green-200" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5" />
                      {provider.name}
                      <Badge variant={isConfigured ? "default" : "secondary"}>
                        {isConfigured ? "Configured" : "Not Setup"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {provider.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isConfigured && (
                      <div className="text-sm text-muted-foreground">
                        Key: {currentKey?.substring(0, 8)}...
                      </div>
                    )}

                    {/* API Key Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${provider.id}-key`}
                          type={showKey ? "text" : "password"}
                          placeholder={`${provider.keyPrefix}xxxxxxxxxxxxxxxxxxxx`}
                          value={apiKeys[provider.id]}
                          onChange={(e) => setApiKeys(prev => ({ 
                            ...prev, 
                            [provider.id]: e.target.value 
                          }))}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowApiKeys(prev => ({ 
                            ...prev, 
                            [provider.id]: !prev[provider.id] 
                          }))}
                        >
                          {showKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleSaveApiKey(provider.id)} 
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Key
                      </Button>
                      {isConfigured && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRemoveApiKey(provider.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Setup Instructions */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>Setup Instructions:</strong></p>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {provider.setupInstructions.map((instruction, index) => (
                              <li key={index}>
                                {index === 0 ? (
                                  <a 
                                    href={provider.setupUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                  >
                                    {instruction} <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                ) : instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            {/* Provider Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Preferences</CardTitle>
                <CardDescription>
                  Configure which AI provider to use first when multiple are available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preferred-provider">Preferred Provider</Label>
                  <Select value={preferredProvider} onValueChange={setPreferredProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map(provider => {
                        const IconComponent = provider.icon;
                        return (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {provider.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleSavePreferredProvider} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Createosaur will automatically fall back to other configured providers if your preferred provider fails.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* App Info */}
            <Card>
              <CardHeader>
                <CardTitle>Application Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p><strong>Version:</strong> 2.0.0</p>
                <p><strong>Mode:</strong> {hasAnyProvider ? "Multi-Provider AI" : "Demo Mode"}</p>
                <p><strong>Configured Providers:</strong> {configuredProviders.length > 0 ? configuredProviders.map(p => p.name).join(', ') : 'None'}</p>
                <p><strong>Available Models:</strong> DALL-E 3/2, Stable Diffusion, SVG Demo</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}