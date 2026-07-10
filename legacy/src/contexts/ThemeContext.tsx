import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  gradientPrimary: string;
  gradientLab: string;
  glowPrimary: string;
  glowAccent: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const themes: Theme[] = [
  {
    id: 'createosaur',
    name: 'Createosaur Lab',
    colors: {
      background: '222 47% 5%',
      foreground: '180 100% 95%',
      card: '200 50% 8%',
      cardForeground: '180 100% 95%',
      primary: '188 100% 50%',
      primaryForeground: '222 47% 5%',
      secondary: '200 50% 15%',
      secondaryForeground: '180 100% 95%',
      accent: '120 100% 50%',
      accentForeground: '222 47% 5%',
      muted: '200 30% 12%',
      mutedForeground: '180 30% 70%',
      border: '188 50% 25%',
      input: '200 50% 12%',
      ring: '188 100% 50%',
      destructive: '0 84% 60%',
      destructiveForeground: '180 100% 95%',
      gradientPrimary: 'linear-gradient(135deg, hsl(188 100% 50%), hsl(120 100% 50%))',
      gradientLab: 'linear-gradient(180deg, hsl(200 50% 8%), hsl(222 47% 5%))',
      glowPrimary: '0 0 20px hsl(188 100% 50% / 0.5)',
      glowAccent: '0 0 20px hsl(120 100% 50% / 0.5)',
    },
  },
  {
    id: 'jurassic-park',
    name: 'Jurassic Park',
    colors: {
      background: '45 20% 8%',
      foreground: '45 15% 95%',
      card: '45 25% 12%',
      cardForeground: '45 15% 95%',
      primary: '45 95% 60%',
      primaryForeground: '45 20% 8%',
      secondary: '120 40% 20%',
      secondaryForeground: '45 15% 95%',
      accent: '120 80% 45%',
      accentForeground: '45 20% 8%',
      muted: '45 20% 15%',
      mutedForeground: '45 15% 70%',
      border: '45 50% 30%',
      input: '45 25% 15%',
      ring: '45 95% 60%',
      destructive: '0 84% 60%',
      destructiveForeground: '45 15% 95%',
      gradientPrimary: 'linear-gradient(135deg, hsl(45 95% 60%), hsl(120 80% 45%))',
      gradientLab: 'linear-gradient(180deg, hsl(45 25% 12%), hsl(45 20% 8%))',
      glowPrimary: '0 0 20px hsl(45 95% 60% / 0.6)',
      glowAccent: '0 0 20px hsl(120 80% 45% / 0.5)',
    },
  },
  {
    id: 'ice-age',
    name: 'Ice Age',
    colors: {
      background: '200 30% 10%',
      foreground: '200 20% 95%',
      card: '200 35% 15%',
      cardForeground: '200 20% 95%',
      primary: '190 100% 70%',
      primaryForeground: '200 30% 10%',
      secondary: '200 40% 25%',
      secondaryForeground: '200 20% 95%',
      accent: '220 100% 80%',
      accentForeground: '200 30% 10%',
      muted: '200 25% 18%',
      mutedForeground: '200 20% 70%',
      border: '190 50% 35%',
      input: '200 35% 18%',
      ring: '190 100% 70%',
      destructive: '0 84% 60%',
      destructiveForeground: '200 20% 95%',
      gradientPrimary: 'linear-gradient(135deg, hsl(190 100% 70%), hsl(220 100% 80%))',
      gradientLab: 'linear-gradient(180deg, hsl(200 35% 15%), hsl(200 30% 10%))',
      glowPrimary: '0 0 20px hsl(190 100% 70% / 0.5)',
      glowAccent: '0 0 20px hsl(220 100% 80% / 0.4)',
    },
  },
  {
    id: 'volcanic',
    name: 'Volcanic Era',
    colors: {
      background: '15 30% 8%',
      foreground: '15 20% 95%',
      card: '15 35% 12%',
      cardForeground: '15 20% 95%',
      primary: '15 100% 60%',
      primaryForeground: '15 30% 8%',
      secondary: '25 60% 20%',
      secondaryForeground: '15 20% 95%',
      accent: '5 100% 55%',
      accentForeground: '15 30% 8%',
      muted: '15 25% 15%',
      mutedForeground: '15 20% 70%',
      border: '15 70% 35%',
      input: '15 35% 15%',
      ring: '15 100% 60%',
      destructive: '0 84% 60%',
      destructiveForeground: '15 20% 95%',
      gradientPrimary: 'linear-gradient(135deg, hsl(15 100% 60%), hsl(5 100% 55%))',
      gradientLab: 'linear-gradient(180deg, hsl(15 35% 12%), hsl(15 30% 8%))',
      glowPrimary: '0 0 20px hsl(15 100% 60% / 0.6)',
      glowAccent: '0 0 20px hsl(5 100% 55% / 0.5)',
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    colors: {
      background: '210 40% 6%',
      foreground: '210 30% 95%',
      card: '210 45% 10%',
      cardForeground: '210 30% 95%',
      primary: '180 100% 50%',
      primaryForeground: '210 40% 6%',
      secondary: '210 50% 18%',
      secondaryForeground: '210 30% 95%',
      accent: '160 100% 40%',
      accentForeground: '210 40% 6%',
      muted: '210 35% 13%',
      mutedForeground: '210 25% 70%',
      border: '180 60% 28%',
      input: '210 45% 13%',
      ring: '180 100% 50%',
      destructive: '0 84% 60%',
      destructiveForeground: '210 30% 95%',
      gradientPrimary: 'linear-gradient(135deg, hsl(180 100% 50%), hsl(160 100% 40%))',
      gradientLab: 'linear-gradient(180deg, hsl(210 45% 10%), hsl(210 40% 6%))',
      glowPrimary: '0 0 20px hsl(180 100% 50% / 0.5)',
      glowAccent: '0 0 20px hsl(160 100% 40% / 0.4)',
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('createosaur-theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    Object.entries(colors).forEach(([key, value]) => {
      if (key.startsWith('gradient') || key.startsWith('glow')) {
        root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      } else {
        root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      }
    });
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('createosaur-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};