/** @type {import('tailwindcss').Config} */
// NOTE: NativeWind config must be CommonJS, so it cannot import theme.ts directly.
// These values MIRROR theme.ts — theme.ts is canonical; keep the two in sync.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bone: '#EDEAE2',
        porcelain: '#FAF8F4',
        porcelain2: '#F4F1EA',
        ink: '#15160F',
        ink2: '#22241A',
        graphite: '#5A5C50',
        sage: '#7E8B6C',
        'sage-deep': '#5F6C4D',
        'sage-mist': '#AEB7A0',
        'sage-wash': '#E4E7DC',
        bronze: '#9C7C49',
        'bronze-glow': '#C9A669',
        stone: '#CBC4B6',
        hair: '#E3DED4',
      },
      fontFamily: {
        brand: ['Jost_300Light'],
        'brand-reg': ['Jost_400Regular'],
        ui: ['HankenGrotesk_400Regular'],
        'ui-light': ['HankenGrotesk_300Light'],
        'ui-med': ['HankenGrotesk_500Medium'],
        'ui-semi': ['HankenGrotesk_600SemiBold'],
        mono: ['GeistMono_400Regular'],
        'mono-med': ['GeistMono_500Medium'],
      },
      borderRadius: {
        card: '26px',
        panel: '22px',
        control: '15px',
        chip: '12px',
      },
      letterSpacing: {
        eyebrow: '0.2em',
        tightest: '-0.03em',
      },
    },
  },
  plugins: [],
};
