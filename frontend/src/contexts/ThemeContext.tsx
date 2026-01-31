import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useProfile } from './ProfileContext';
import { themes, type ThemeConfig, type ThemeName } from '../themes/themeConfig';

interface ThemeContextType {
  theme: ThemeConfig;
  availableThemes: ThemeConfig[];
  updateTheme: (themeName: ThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfileTheme } = useProfile();
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(themes.blue);

  // Update theme when profile changes
  useEffect(() => {
    if (profile?.theme) {
      setCurrentTheme(themes[profile.theme] || themes.blue);
    } else {
      setCurrentTheme(themes.blue);
    }
  }, [profile]);

  // Update CSS variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS variables from current theme
    root.style.setProperty('--primary', currentTheme.colors.primary);
    root.style.setProperty('--primary-hover', currentTheme.token.colorPrimaryHover);
    root.style.setProperty('--secondary', currentTheme.colors.secondary);
    root.style.setProperty('--background', currentTheme.colors.background);
    root.style.setProperty('--surface', currentTheme.colors.surface);
    root.style.setProperty('--text-main', currentTheme.colors.textMain);
    root.style.setProperty('--text-muted', currentTheme.colors.textMuted);
    root.style.setProperty('--border', currentTheme.colors.border);
    
    // Set color-scheme based on theme
    if (currentTheme.name === 'dark') {
      root.style.setProperty('color-scheme', 'dark');
    } else {
      root.style.setProperty('color-scheme', 'light');
    }
  }, [currentTheme]);

  const updateTheme = async (themeName: ThemeName) => {
    if (profile?.id) {
      await updateProfileTheme(profile.id, themeName);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        availableThemes: Object.values(themes),
        updateTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
