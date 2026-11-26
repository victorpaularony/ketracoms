/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#106050';
const tintColorDark = '#1B6A57';

/** KETRACO green-and-white palette matching the inovation logo colors. */
export const AdminColors = {
  bg: '#F4F8F6',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#D6E4DD',
  primary: '#106050',
  primaryDark: '#0B463A',
  primaryLight: '#E6F4EF',
  accent: '#1B6A57',
  accentLight: '#E6F4EF',
  warning: '#D97706',
  textPri: '#0F2922',
  textSec: '#475E57',
  textMuted: '#6B827B',
  white: '#FFFFFF',
};

export const Colors = {
  light: {
    text: '#0F2922',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#475E57',
    tabIconDefault: '#6B827B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#0F2922',
    background: '#FFFFFF',
    tint: tintColorDark,
    icon: '#475E57',
    tabIconDefault: '#6B827B',
    tabIconSelected: tintColorDark,
  },
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
