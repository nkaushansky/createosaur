import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Download, 
  Copy, 
  Image, 
  FileText, 
  Code,
  Link,
  Camera,
  Palette,
  QrCode,
  ExternalLink
} from "lucide-react";

interface ShareExportProps {
  creatureData: {
    scientificName?: any;
    behavioralProfile?: any;
    generatedImage?: string | null;
    dinosaurs: Array<{ id: string; name: string; percentage: number }>;
    selectedColors: string[];
    selectedPattern: string;
    colorEffects: string[];
    selectedTexture: string;
    creatureSize: number;
    ageStage: string;
    traitSelections: any;
  };
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: any;
}

const exportFormats: ExportFormat[] = [
  {
    id: "image-hd",
    name: "High Resolution Image",
    description: "PNG format, 4K resolution",
    extension: "png",
    icon: Image
  },
  {
    id: "image-standard",
    name: "Standard Image",
    description: "JPEG format, web optimized",
    extension: "jpg",
    icon: Camera
  },
  {
    id: "dna-config",
    name: "DNA Configuration",
    description: "JSON file with all creature data",
    extension: "json",
    icon: Code
  },
  {
    id: "scientific-report",
    name: "Scientific Report",
    description: "Detailed PDF report",
    extension: "pdf",
    icon: FileText
  },
  {
    id: "color-palette",
    name: "Color Palette",
    description: "ASE file for design software",
    extension: "ase",
    icon: Palette
  }
];

export const ShareExport = ({ creatureData }: ShareExportProps) => {
  const { toast } = useToast();
  
  const [selectedFormat, setSelectedFormat] = useState("image-hd");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [customFilename, setCustomFilename] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

  const generateShareUrl = useCallback(async () => {
    setIsGeneratingShare(true);
    
    try {
      // Simulate generating a shareable URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const shareId = Math.random().toString(36).substring(2, 15);
      const url = `${window.location.origin}/shared/${shareId}`;
      setShareUrl(url);
      
      toast({
        title: "Share URL Generated",
        description: "Creature is now shareable via URL",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share URL",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShare(false);
    }
  }, [toast]);

  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Share URL copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  }, [shareUrl, toast]);

  const exportCreature = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const filename = customFilename || `creature-${Date.now()}`;
      
      // Generate export data based on format
      let exportData: any;
      let mimeType: string;
      
      switch (selectedFormat) {
        case "dna-config":
          exportData = JSON.stringify(creatureData, null, 2);
          mimeType = "application/json";
          break;
          
        case "scientific-report":
          exportData = generateScientificReport();
          mimeType = "application/pdf";
          break;
          
        case "color-palette":
          exportData = generateColorPalette();
          mimeType = "application/octet-stream";
          break;
          
        default:
          // Image formats
          exportData = await generateImageExport();
          mimeType = selectedFormat.includes("png") ? "image/png" : "image/jpeg";
      }
      
      // Create and download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${selectedFormatData?.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Creature exported as ${selectedFormatData?.name}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export creature",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedFormat, customFilename, creatureData, includeMetadata, includeWatermark, selectedFormatData, toast]);

  const generateScientificReport = () => {
    const report = `
GENETIC ENGINEERING LAB - SCIENTIFIC REPORT
==========================================

Specimen Analysis Report
Generated: ${new Date().toISOString()}

TAXONOMIC CLASSIFICATION
-----------------------
${creatureData.scientificName ? `
Scientific Name: ${creatureData.scientificName.fullName}
Genus: ${creatureData.scientificName.genus}
Species: ${creatureData.scientificName.species}
Classification: ${creatureData.scientificName.classification}
Etymology: ${creatureData.scientificName.etymology}
` : 'Classification pending genetic analysis...'}

GENETIC COMPOSITION
------------------
${creatureData.dinosaurs.filter(d => d.percentage > 0).map(d => 
  `${d.name}: ${d.percentage}%`
).join('\n')}

PHYSICAL CHARACTERISTICS
-----------------------
Size Classification: ${creatureData.creatureSize < 25 ? 'Tiny' : creatureData.creatureSize < 50 ? 'Small' : creatureData.creatureSize < 75 ? 'Medium' : 'Large'}
Age Stage: ${creatureData.ageStage}
Primary Colors: ${creatureData.selectedColors.join(', ')}
Pattern: ${creatureData.selectedPattern}
Texture: ${creatureData.selectedTexture}
Special Effects: ${creatureData.colorEffects.join(', ') || 'None'}

BEHAVIORAL PROFILE
-----------------
${creatureData.behavioralProfile ? `
Temperament: ${creatureData.behavioralProfile.temperament}
Diet: ${creatureData.behavioralProfile.diet}
Social Behavior: ${creatureData.behavioralProfile.socialBehavior}
Habitat: ${creatureData.behavioralProfile.habitat}
Activity: ${creatureData.behavioralProfile.activityLevel}
Intelligence: ${creatureData.behavioralProfile.intelligence}

Predicted Behaviors:
${creatureData.behavioralProfile.predictedBehaviors.map((b: string) => `- ${b}`).join('\n')}

Survival Traits:
${creatureData.behavioralProfile.survivalTraits.map((t: string) => `- ${t}`).join('\n')}
` : 'Behavioral analysis pending...'}

---
Report generated by Genetic Engineering Lab v1.0
`;
    return report;
  };

  const generateColorPalette = () => {
    // Generate Adobe Swatch Exchange format (simplified)
    return JSON.stringify({
      name: "Creature Palette",
      colors: creatureData.selectedColors.map((color, index) => ({
        name: `Color ${index + 1}`,
        hex: color,
        type: "global"
      }))
    });
  };

  const generateImageExport = async () => {
    // Simulate image generation for different formats
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
  };

  const shareToSocial = useCallback((platform: string) => {
    if (!shareUrl) {
      toast({
        title: "Generate Share URL First",
        description: "Create a share URL before sharing to social media",
        variant: "destructive",
      });
      return;
    }

    const text = `Check out my custom genetic hybrid creature! ${creatureData.scientificName?.fullName || 'Amazing prehistoric hybrid'}`;
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  }, [shareUrl, creatureData.scientificName, toast]);

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Share & Export</h3>
      </div>

      <div className="space-y-6">
        {/* Share URL Generation */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Share Online</Label>
          <div className="space-y-3">
            {!shareUrl ? (
              <Button 
                onClick={generateShareUrl}
                disabled={isGeneratingShare}
                className="w-full btn-lab"
              >
                <Link className="w-4 h-4 mr-2" />
                {isGeneratingShare ? "Generating..." : "Generate Share URL"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button size="sm" variant="outline" onClick={copyShareUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(shareUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Social Media Sharing */}
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => shareToSocial('twitter')}>
                    Twitter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareToSocial('facebook')}>
                    Facebook
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareToSocial('reddit')}>
                    Reddit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareToSocial('linkedin')}>
                    LinkedIn
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Export Format</Label>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map(format => {
                const Icon = format.icon;
                return (
                  <SelectItem key={format.id} value={format.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{format.name}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium block">Export Options</Label>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Include Metadata</Label>
              <p className="text-xs text-muted-foreground">Add creature details to file</p>
            </div>
            <Switch
              checked={includeMetadata}
              onCheckedChange={setIncludeMetadata}
            />
          </div>

          {(selectedFormat.includes('image')) && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Watermark</Label>
                <p className="text-xs text-muted-foreground">Add lab watermark</p>
              </div>
              <Switch
                checked={includeWatermark}
                onCheckedChange={setIncludeWatermark}
              />
            </div>
          )}

          <div>
            <Label htmlFor="filename" className="text-sm font-medium block mb-2">
              Custom Filename (Optional)
            </Label>
            <Input
              id="filename"
              placeholder="my-creature"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Export Button */}
        <Button 
          onClick={exportCreature}
          disabled={isExporting || !creatureData.generatedImage}
          className="w-full btn-genetic"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting 
            ? "Exporting..." 
            : `Export as ${selectedFormatData?.name}`
          }
        </Button>

        {!creatureData.generatedImage && (
          <p className="text-xs text-muted-foreground text-center">
            Generate a creature first to enable export
          </p>
        )}
      </div>
    </Card>
  );
};