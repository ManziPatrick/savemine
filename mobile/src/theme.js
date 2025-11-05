import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0,
    lineHeight: 20,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 20,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 20,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 20,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 17,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 15,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 17,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Classic finance color palette - Navy, Gold, Elegant Grays
    primary: '#1a365d', // Deep navy blue - trust and stability
    secondary: '#d4af37', // Classic gold - wealth and prosperity
    tertiary: '#2c5f7c', // Teal blue - sophistication
    error: '#c53030', // Refined red
    warning: '#d69e2e', // Warm amber
    success: '#2f855a', // Professional green
    background: '#ffffff',
    surface: '#f7fafc', // Very light blue-gray
    surfaceVariant: '#edf2f7',
    text: '#1a202c', // Near black
    textSecondary: '#4a5568', // Medium gray
    outline: '#cbd5e0', // Light border
    outlineVariant: '#e2e8f0',
  },
};

export const colors = {
  // Primary palette
  primary: '#1a365d', // Deep navy - main brand color
  primaryLight: '#2d4a6b',
  primaryDark: '#0f2438',
  secondary: '#d4af37', // Classic gold
  secondaryLight: '#e6c866',
  secondaryDark: '#b8941f',
  
  // Accent colors
  accent: '#2c5f7c', // Teal blue
  accentLight: '#4a7a99',
  accentDark: '#1e4459',
  
  // Status colors
  success: '#2f855a',
  successLight: '#48bb78',
  successDark: '#22543d',
  error: '#c53030',
  errorLight: '#fc8181',
  errorDark: '#9b2c2c',
  warning: '#d69e2e',
  warningLight: '#f6e05e',
  warningDark: '#b7791f',
  info: '#3182ce',
  infoLight: '#63b3ed',
  infoDark: '#2c5282',
  
  // Neutral colors
  background: '#ffffff',
  surface: '#f7fafc',
  surfaceElevated: '#ffffff',
  surfaceDisabled: '#edf2f7',
  
  // Text colors
  text: '#1a202c',
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  textTertiary: '#718096',
  textDisabled: '#a0aec0',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#edf2f7',
  borderDark: '#cbd5e0',
  
  // Overlay
  overlay: 'rgba(26, 32, 44, 0.75)',
  overlayLight: 'rgba(26, 32, 44, 0.5)',
};

