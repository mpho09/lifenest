/**
 * Design tokens (IMPLEMENTATION_PLAN Section 7.1). The only place colours,
 * font sizes, spacing, radii and sizes are defined. Plain data with no
 * imports, so tailwind.config.js can read it too.
 */

const palette = {
  navy: '#1F3A4D',
  gold: '#B08A4A',
  error: '#B3261E',
  success: '#2E7D32',
} as const;

export const tokens = {
  color: {
    primary: palette.navy,
    accent: palette.gold, // borders, ring fill, 3D highlights; never text on light backgrounds
    background: '#FAF8F4',
    surface: '#FFFFFF',
    text: '#1E2329',
    textSecondary: '#5A6670',
    divider: '#E5E1D8',
    error: palette.error,
    success: palette.success,
    warning: '#8A5A00',
    chip: {
      accepted: palette.navy,
      invited: '#6B7280',
      requestOpen: palette.gold,
      released: palette.success,
      rejected: palette.error,
    },
    toastBackground: '#1E2329',
    placeholder: '#E9E5DC',
    badge: palette.gold,
    three: { navy: palette.navy, gold: palette.gold, light: '#FFF6E5' },
  },
  font: {
    heading: 'Lora_600SemiBold',
    family: { regular: 'Inter_400Regular', semibold: 'Inter_600SemiBold' },
    title: { fontFamily: 'Lora_600SemiBold', fontSize: 24 },
    section: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
    body: { fontFamily: 'Inter_400Regular', fontSize: 16 },
    button: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
    small: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  },
  space: { 1: 4, 2: 8, 4: 16, 6: 24, screen: 16 },
  radius: { card: 12, button: 10, input: 8, circle: 9999 },
  shadow: { card: '0px 1px 3px rgba(0, 0, 0, 0.08)' },
  size: { button: 48, touchMin: 48 },
  three: { minFps: 30 },
  // Web layout (Section 18 #34): sidebar from this width up; content and form widths.
  layout: { wideBreakpoint: 900, sidebar: 256, content: 1120, narrow: 640 },
} as const;

export type Tokens = typeof tokens;
