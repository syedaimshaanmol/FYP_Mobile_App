/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const CreovatorTheme = {
  colors: {
    bgDark: '#160d33',
    bgDarker: '#0f0a1f',
    bgCard: '#21124b',
    bgCardAlt: '#28145e',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    cardBorderHover: 'rgba(99, 102, 241, 0.4)',
    primary: '#6366f1',
    primaryGlow: 'rgba(99, 102, 241, 0.25)',
    secondary: '#f9bb1e',
    secondaryGlow: 'rgba(249, 187, 30, 0.25)',
    cyan: '#22d3ee',
    fuchsia: '#ec4899',
    success: '#10b981',
    destructive: '#ef4444',
    textWhite: '#ffffff',
    textLight: '#e2e8f0',
    textMuted: '#9ca3af',
    textDim: '#64748b',
    inputBg: 'rgba(255, 255, 255, 0.07)',
    inputBorder: 'rgba(255, 255, 255, 0.15)',
  },
};

export const CreovatorColors = {
  bgDark: CreovatorTheme.colors.bgDark,
  bgDarker: CreovatorTheme.colors.bgDarker,
  surfaceDark: CreovatorTheme.colors.bgCard,
  surfaceElevated: CreovatorTheme.colors.bgCardAlt,
  borderDark: CreovatorTheme.colors.cardBorder,
  borderLight: CreovatorTheme.colors.cardBorderHover,
  primary: CreovatorTheme.colors.primary,
  primaryDark: '#4338ca',
  primaryLight: '#818cf8',
  accentGold: CreovatorTheme.colors.secondary,
  cyan: CreovatorTheme.colors.cyan,
  fuchsia: CreovatorTheme.colors.fuchsia,
  success: CreovatorTheme.colors.success,
  error: CreovatorTheme.colors.destructive,
  textPrimary: CreovatorTheme.colors.textWhite,
  textSecondary: CreovatorTheme.colors.textLight,
  textMuted: CreovatorTheme.colors.textMuted,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
