import type { Config } from 'tailwindcss';

import { tokens } from './theme/tokens';

/** NativeWind theme built only from theme/tokens.ts (Section 7.1). */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  presets: [require('nativewind/preset')],
  // Dark mode is deferred (Section 3.3) and app.json forces light. 'class' stops
  // NativeWind on web from throwing when Expo sets the colour scheme.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: tokens.color.primary,
        accent: tokens.color.accent,
        background: tokens.color.background,
        surface: tokens.color.surface,
        text: tokens.color.text,
        'text-secondary': tokens.color.textSecondary,
        divider: tokens.color.divider,
        error: tokens.color.error,
        success: tokens.color.success,
        warning: tokens.color.warning,
        placeholder: tokens.color.placeholder,
        badge: tokens.color.badge,
        'toast-background': tokens.color.toastBackground,
        chip: tokens.color.chip,
      },
      fontFamily: {
        heading: [tokens.font.heading],
        sans: [tokens.font.family.regular],
        semibold: [tokens.font.family.semibold],
      },
      fontSize: {
        title: `${tokens.font.title.fontSize}px`,
        section: `${tokens.font.section.fontSize}px`,
        body: `${tokens.font.body.fontSize}px`,
        button: `${tokens.font.button.fontSize}px`,
        small: `${tokens.font.small.fontSize}px`,
      },
      spacing: {
        1: `${tokens.space[1]}px`,
        2: `${tokens.space[2]}px`,
        4: `${tokens.space[4]}px`,
        6: `${tokens.space[6]}px`,
        screen: `${tokens.space.screen}px`,
        button: `${tokens.size.button}px`,
        'touch-min': `${tokens.size.touchMin}px`,
      },
      borderRadius: {
        card: `${tokens.radius.card}px`,
        button: `${tokens.radius.button}px`,
        input: `${tokens.radius.input}px`,
        circle: `${tokens.radius.circle}px`,
      },
      boxShadow: { card: tokens.shadow.card },
    },
  },
  plugins: [],
} satisfies Config;
