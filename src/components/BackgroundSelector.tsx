import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Image, Mountain, Trees, Waves, Building, Users } from 'lucide-react';

export interface BackgroundOption {
  id: string;
  name: string;
  category: string;
  gradient: string;
  icon: React.ReactNode;
}

export const backgroundOptions: BackgroundOption[] = [
  // Natural Environments
  {
    id: 'jungle',
    name: 'Dense Jungle',
    category: 'Natural',
    gradient: 'linear-gradient(135deg, hsl(120 60% 15%) 0%, hsl(100 80% 25%) 50%, hsl(80 90% 35%) 100%)',
    icon: <Trees className="w-4 h-4" />,
  },
  {
    id: 'desert',
    name: 'Desert Plains',
    category: 'Natural',
    gradient: 'linear-gradient(135deg, hsl(45 80% 60%) 0%, hsl(35 90% 70%) 50%, hsl(25 85% 80%) 100%)',
    icon: <Mountain className="w-4 h-4" />,
  },
  {
    id: 'beach',
    name: 'Coastal Beach',
    category: 'Natural',
    gradient: 'linear-gradient(135deg, hsl(200 70% 60%) 0%, hsl(45 80% 75%) 50%, hsl(45 85% 85%) 100%)',
    icon: <Waves className="w-4 h-4" />,
  },
  {
    id: 'mountains',
    name: 'Rocky Mountains',
    category: 'Natural',
    gradient: 'linear-gradient(135deg, hsl(220 20% 30%) 0%, hsl(210 25% 45%) 50%, hsl(200 30% 60%) 100%)',
    icon: <Mountain className="w-4 h-4" />,
  },
  {
    id: 'volcanic',
    name: 'Volcanic Landscape',
    category: 'Natural',
    gradient: 'linear-gradient(135deg, hsl(15 80% 25%) 0%, hsl(5 90% 40%) 50%, hsl(25 85% 60%) 100%)',
    icon: <Mountain className="w-4 h-4" />,
  },
  
  // Constructed Habitats
  {
    id: 'zoo-enclosure',
    name: 'Zoo Enclosure',
    category: 'Constructed',
    gradient: 'linear-gradient(135deg, hsl(100 40% 40%) 0%, hsl(60 30% 80%) 50%, hsl(210 20% 90%) 100%)',
    icon: <Building className="w-4 h-4" />,
  },
  {
    id: 'research-facility',
    name: 'Research Facility',
    category: 'Constructed',
    gradient: 'linear-gradient(135deg, hsl(210 30% 20%) 0%, hsl(200 40% 30%) 50%, hsl(190 50% 40%) 100%)',
    icon: <Building className="w-4 h-4" />,
  },
  {
    id: 'glass-dome',
    name: 'Glass Dome',
    category: 'Constructed',
    gradient: 'linear-gradient(135deg, hsl(200 50% 85%) 0%, hsl(180 40% 90%) 50%, hsl(160 30% 95%) 100%)',
    icon: <Building className="w-4 h-4" />,
  },
  
  // Social Settings
  {
    id: 'herd',
    name: 'Dinosaur Herd',
    category: 'Social',
    gradient: 'linear-gradient(135deg, hsl(80 60% 40%) 0%, hsl(60 70% 60%) 50%, hsl(40 80% 80%) 100%)',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'pack-hunting',
    name: 'Pack Hunting',
    category: 'Social',
    gradient: 'linear-gradient(135deg, hsl(30 40% 30%) 0%, hsl(20 60% 50%) 50%, hsl(10 80% 70%) 100%)',
    icon: <Users className="w-4 h-4" />,
  },
];

interface BackgroundSelectorProps {
  selectedBackground: string;
  onBackgroundChange: (backgroundId: string) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onBackgroundChange,
}) => {
  const selectedOption = backgroundOptions.find(bg => bg.id === selectedBackground);
  const categories = [...new Set(backgroundOptions.map(bg => bg.category))];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Image className="w-4 h-4" />
          {selectedOption?.name || 'Select Background'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {categories.map((category) => (
          <div key={category}>
            <DropdownMenuLabel>{category} Environments</DropdownMenuLabel>
            {backgroundOptions
              .filter(bg => bg.category === category)
              .map((background) => (
                <DropdownMenuItem
                  key={background.id}
                  onClick={() => onBackgroundChange(background.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {background.icon}
                  <span>{background.name}</span>
                  {selectedBackground === background.id && (
                    <div className="ml-auto w-3 h-3 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            {category !== categories[categories.length - 1] && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};