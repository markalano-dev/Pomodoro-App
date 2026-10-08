// src/config/theme.ts

export const OPTION_A_COLORS = {
  light: {
    bg: '#FAF7F2',          // Cream Vanilla
    card: '#FFFFFF',        // Pure White
    textPrimary: '#2D3142', // Deep Slate
    textSecondary: '#8D99AE',// Soft Charcoal Gray
    accentFocus: '#FF7E67', // Warm Tangelo / Sunset Coral
    accentBreak: '#4ECDC4', // Soft Mint Teal
    inputBg: '#F2EFE9',     // Subtle Warm Input Fill
    border: '#EAE6DF',      // Soft Border
    circleRingBg: '#F5F2EC',// Outer Ring Fill
    danger: '#FF6B6B',
  },
  dark: {
    bg: '#161722',          // Obsidian Charcoal
    card: '#202230',        // Midnight Card
    textPrimary: '#FFFFFF', // Clean White
    textSecondary: '#8E92A8',// Muted Violet Gray
    accentFocus: '#FF7E67', // Warm Tangelo
    accentBreak: '#4ECDC4', // Soft Mint Teal
    inputBg: '#2A2D3F',     // Dark Input Fill
    border: '#2D3042',      // Dark Border
    circleRingBg: '#252838',// Outer Ring Fill
    danger: '#FF6B6B',
  },
};

export const getThemeColors = (isDark?: boolean) =>
  isDark ? OPTION_A_COLORS.dark : OPTION_A_COLORS.light;