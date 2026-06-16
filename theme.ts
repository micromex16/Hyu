// ════════════════════════════════════════════════════════════════════════════
// Hyu design system — single source of truth for tokens.
//
// App runtime code (SVG strokes, gradients, shadows, StatText) imports from here.
// tailwind.config.js mirrors these values for NativeWind className utilities
// (NativeWind config must be CommonJS, so it can't import this TS module directly —
// keep the two in sync; this file is canonical).
// ════════════════════════════════════════════════════════════════════════════

export const color = {
  bone: '#EDEAE2', // app canvas
  porcelain: '#FAF8F4', // cards / raised surfaces
  porcelain2: '#F4F1EA', // recessed surface, set rows
  ink: '#15160F', // primary text, dark surfaces
  ink2: '#22241A', // elevated dark (challenge cards)
  graphite: '#5A5C50', // secondary text on light
  sage: '#7E8B6C', // hero accent — everyday
  sageDeep: '#5F6C4D', // emphasis, protein, pressed
  sageMist: '#AEB7A0', // secondary text on dark, soft fills
  sageWash: '#E4E7DC', // tints, track fills, thumbnails
  bronze: '#9C7C49', // ACHIEVEMENT ONLY
  bronzeGlow: '#C9A669', // bronze highlight / metallic top
  stone: '#CBC4B6', // stronger borders/dividers
  hair: '#E3DED4', // hairlines
} as const;

// Common gradient stop-pairs used across the system.
export const gradient = {
  appBg: ['#F4F1EA', '#E9E5DB', '#E3DFD4'] as const,
  sage: ['#7E8B6C', '#5F6C4D'] as const, // primary button
  sageRing: ['#5F6C4D', '#9AA784'] as const, // calorie ring
  proteinBar: ['#5F6C4D', '#7E8B6C'] as const,
  ink: ['#2A2C20', '#15160F'] as const, // ink button
  darkCard: ['#22241A', '#15160F'] as const, // challenge card
  bronze: ['#C9A669', '#9C7C49'] as const, // metallic / achievement
};

export const font = {
  brand: 'Jost_300Light',
  brandReg: 'Jost_400Regular',
  ui: 'HankenGrotesk_400Regular',
  uiLight: 'HankenGrotesk_300Light',
  uiMed: 'HankenGrotesk_500Medium',
  uiSemi: 'HankenGrotesk_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMed: 'GeistMono_500Medium',
} as const;

export const radius = { card: 26, panel: 22, control: 15, chip: 12, pill: 999 } as const;

export const space = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 } as const;

// Soft, warm shadows — set both iOS and Android so surfaces float on both.
// Premium = barely-there elevation: low opacity, wide diffuse radius, small offset.
export const shadow = {
  // Default card: a whisper of warm shadow, no harsh edge.
  card: {
    shadowColor: '#1A1B12',
    shadowOpacity: 0.05,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  // Slightly more lift for primary CTAs / hero surfaces.
  raised: {
    shadowColor: '#1A1B12',
    shadowOpacity: 0.08,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
} as const;

// Hairline used as a near-invisible edge on light-on-light cards (crispness
// without the "boxed-in" look of a visible border).
export const hairlineBorder = 'rgba(21,22,15,0.045)';
