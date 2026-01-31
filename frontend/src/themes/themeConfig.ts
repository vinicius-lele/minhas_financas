export type ThemeName = 'blue' | 'dark' | 'brown' | 'green' | 'pink' | 'purple';

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  token: {
    colorPrimary: string;
    colorPrimaryHover: string;
    colorBgContainer: string;
    colorBgElevated: string;
    colorBgLayout: string;
    colorText: string;
    colorTextSecondary: string;
    colorBorder: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textMain: string;
    textMuted: string;
    border: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  blue: {
    name: 'blue',
    displayName: 'Padrão',
    token: {
      colorPrimary: '#2563eb',
      colorPrimaryHover: '#1d4ed8',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f8fafc',
      colorText: '#0f172a',
      colorTextSecondary: '#64748b',
      colorBorder: '#e2e8f0',
    },
    colors: {
      primary: '#2563eb',
      secondary: '#475569',
      background: '#f8fafc',
      surface: '#ffffff',
      textMain: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Escuro',
    token: {
      colorPrimary: '#3b82f6',
      colorPrimaryHover: '#2563eb',
      colorBgContainer: '#1e293b',
      colorBgElevated: '#1e293b',
      colorBgLayout: '#0f172a',
      colorText: '#f1f5f9',
      colorTextSecondary: '#94a3b8',
      colorBorder: '#334155',
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      textMain: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  },
  brown: {
    name: 'brown',
    displayName: 'Marrom',
    token: {
      colorPrimary: '#f18539',
      colorPrimaryHover: '#d96b27',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#fef3e2',
      colorText: '#431e09',
      colorTextSecondary: '#92400e',
      colorBorder: '#fde6d2',
    },
    colors: {
      primary: '#f18539',
      secondary: '#92400e',
      background: '#fef3e2',
      surface: '#ffffff',
      textMain: '#431e09',
      textMuted: '#92400e',
      border: '#fde6d2',
    },
  },
  green: {
    name: 'green',
    displayName: 'Verde',
    token: {
      colorPrimary: '#22c55e',
      colorPrimaryHover: '#16a34a',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f0fdf4',
      colorText: '#166534',
      colorTextSecondary: '#15803d',
      colorBorder: '#dcfce7',
    },
    colors: {
      primary: '#22c55e',
      secondary: '#15803d',
      background: '#f0fdf4',
      surface: '#ffffff',
      textMain: '#166534',
      textMuted: '#15803d',
      border: '#dcfce7',
    },
  },
  pink: {
    name: 'pink',
    displayName: 'Rosa',
    token: {
      colorPrimary: '#ec4899',
      colorPrimaryHover: '#db2777',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#fdf2f8',
      colorText: '#831843',
      colorTextSecondary: '#be185d',
      colorBorder: '#fce7f3',
    },
    colors: {
      primary: '#ec4899',
      secondary: '#be185d',
      background: '#fdf2f8',
      surface: '#ffffff',
      textMain: '#831843',
      textMuted: '#be185d',
      border: '#fce7f3',
    },
  },
  purple: {
    name: 'purple',
    displayName: 'Roxo',
    token: {
      colorPrimary: '#a855f7',
      colorPrimaryHover: '#9333ea',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#faf5ff',
      colorText: '#581c87',
      colorTextSecondary: '#7e22ce',
      colorBorder: '#f3e8ff',
    },
    colors: {
      primary: '#a855f7',
      secondary: '#7e22ce',
      background: '#faf5ff',
      surface: '#ffffff',
      textMain: '#581c87',
      textMuted: '#7e22ce',
      border: '#f3e8ff',
    },
  },
};
