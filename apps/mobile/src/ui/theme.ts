import type { TextStyle } from 'react-native';
/** Primitive → semantic → component. Themes are independent, never inverted. */
export const primitiveTokens = {
  color: {
    forest: '#0F4A3A',
    forestPressed: '#0B382C',
    ivory: '#F7F4ED',
    white: '#FFFFFF',
    stone: '#EEEAE2',
    graphite: '#171B19',
    secondary: '#59635E',
    sage: '#9BAE9E',
    copper: '#D07A46',
    divider: '#DDDCD6',
    night: '#0B0F0E',
    charcoal: '#141917',
    charcoalRaised: '#1D2421',
    warmWhite: '#F2EEE6',
    silver: '#B4BDB8',
    mint: '#6BC6A8',
    mintPressed: '#50A98C',
    copperLight: '#E58A52',
    darkDivider: '#2D3531',
  },
  space: { xxs: 2, xs: 4, sm: 8, compact: 12, md: 16, medium: 20, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  size: { touch: 48, icon: 22, iconSmall: 18, contentMax: 760 },
} as const;
const c = primitiveTokens.color;
export const typography = {
  display: { fontFamily: 'Figtree_700Bold', fontSize: 32, lineHeight: 38 },
  title: { fontFamily: 'Figtree_700Bold', fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: 'Figtree_600SemiBold', fontSize: 20, lineHeight: 26 },
  body: { fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 23 },
  label: { fontFamily: 'Figtree_600SemiBold', fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Figtree_400Regular', fontSize: 14, lineHeight: 20 },
  metadata: { fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 18 },
  price: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  numeric: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;
const lightColors = {
  background: c.ivory,
  surface: c.white,
  subtle: c.stone,
  surfaceSecondary: c.stone,
  text: c.graphite,
  muted: c.secondary,
  primary: c.forest,
  primaryPressed: c.forestPressed,
  onPrimary: c.white,
  border: c.divider,
  controlBorder: '#808A84',
  sage: c.sage,
  accent: c.copper,
  accentText: '#975027',
  accentSubtle: '#F8ECE3',
  danger: '#A42C33',
  dangerSubtle: '#FCEAEC',
  transparent: 'transparent',
  mediaOverlay: 'rgba(11,15,14,0.74)',
  onMedia: '#FFFFFF',
  scrim: 'rgba(11,15,14,0.58)',
};
export type ThemeColors = { [K in keyof typeof lightColors]: string };
const darkColors: ThemeColors = {
  background: c.night,
  surface: c.charcoal,
  subtle: c.charcoalRaised,
  surfaceSecondary: c.charcoalRaised,
  text: c.warmWhite,
  muted: c.silver,
  primary: c.mint,
  primaryPressed: c.mintPressed,
  onPrimary: c.night,
  border: c.darkDivider,
  controlBorder: '#75857C',
  sage: c.sage,
  accent: c.copperLight,
  accentText: c.copperLight,
  accentSubtle: '#32241C',
  danger: '#FF9CA3',
  dangerSubtle: '#341E23',
  transparent: 'transparent',
  mediaOverlay: 'rgba(11,15,14,0.74)',
  onMedia: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.7)',
};
function buildTheme(colors: ThemeColors) {
  const semantic = {
    colors,
    space: primitiveTokens.space,
    radius: primitiveTokens.radius,
    sizes: primitiveTokens.size,
    typography,
  };
  return {
    ...semantic,
    components: {
      button: {
        minHeight: 48,
        radius: 8,
        paddingX: 16,
        paddingY: 8,
        primary: {
          background: colors.primary,
          pressed: colors.primaryPressed,
          foreground: colors.onPrimary,
        },
        secondary: {
          background: colors.surface,
          pressed: colors.subtle,
          foreground: colors.primary,
        },
        ghost: {
          background: colors.transparent,
          pressed: colors.subtle,
          foreground: colors.primary,
        },
        disabled: { background: colors.subtle, foreground: colors.muted },
      },
      field: {
        background: colors.surface,
        border: colors.controlBorder,
        focus: colors.primary,
        radius: 8,
      },
      chip: {
        background: colors.surface,
        selectedBackground: colors.primary,
        foreground: colors.text,
        selectedForeground: colors.onPrimary,
      },
      screen: { background: colors.background, maxWidth: 760 },
      skeleton: { background: colors.border, radius: 8 },
    },
  };
}
export const themes = { light: buildTheme(lightColors), dark: buildTheme(darkColors) };
export type Theme = typeof themes.light;
export const theme = themes.light;
export const semanticTokens = {
  colors: lightColors,
  space: theme.space,
  radius: theme.radius,
  sizes: theme.sizes,
  typography,
};
export const componentTokens = theme.components;
