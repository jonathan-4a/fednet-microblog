/**
 * Centralized theme constants
 * Avoids magic numbers and repeated values throughout the codebase
 */

// Border radius values
export const BORDER_RADIUS = {
  button: 25, // For buttons (pill shape)
  card: 3, // For cards and containers
  small: 2, // For small elements
  medium: 2.5, // For medium elements
} as const

// Common colors (for values not in theme)
export const COLORS = {
  white: '#fff',
  twitterBlue: '#1DA1F2',
  twitterRed: '#f4212e',
  textPrimary: '#0f1419',
  textSecondary: '#536471',
} as const

// Opacity levels for rgba colors
export const OPACITY = {
  hover: 0.05,
  lightHover: 0.03,
  border: 0.08,
  primaryLight: 0.08,
  primaryMedium: 0.12,
  primaryHover: 0.15,
  primaryStrong: 0.25,
  redLight: 0.08,
  redMedium: 0.1,
  shadow: 0.15,
} as const

// Common rgba color combinations
export const RGBA_COLORS = {
  border: 'rgba(0, 0, 0, 0.08)',
  hover: 'rgba(0, 0, 0, 0.05)',
  lightHover: 'rgba(0, 0, 0, 0.03)',
  primaryLight: 'rgba(29, 161, 242, 0.08)',
  primaryMedium: 'rgba(29, 161, 242, 0.12)',
  primaryBorder: 'rgba(29, 161, 242, 0.15)',
  primaryHover: 'rgba(29, 161, 242, 0.25)',
  primaryTabHover: 'rgba(29, 161, 242, 0.1)',
  redLight: 'rgba(244, 33, 46, 0.08)',
  redMedium: 'rgba(244, 33, 46, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.15)',
} as const


