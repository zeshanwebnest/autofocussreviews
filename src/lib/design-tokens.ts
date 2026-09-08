/**
 * Autofocuss Design Tokens
 * Extracted directly from https://autofocuss.com/ai/
 * Shared across the Marketing Landing Page and the App surfaces.
 */

export const tokens = {
  colors: {
    white: '#FFFFFF',
    bgTint: '#F5F8FF',
    ink: '#0B1220',
    slate: '#5B6472',
    slateLight: '#8A93A3',
    line: '#E6EAF2',
    blue: '#2563EB',
    blueDeep: '#1741C4',
    green: '#00C896',
    greenSoft: '#EAFBF5',
    pink: '#FF4D8D',
    pinkSoft: '#FFF1F5',
    amber: '#F5A524',
    amberSoft: '#FFF8E8',
    redSoft: '#FFF7F7',
    redBorder: '#FED7D7',
  },
  typography: {
    fontFamilySans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', monospace",
    sizes: {
      heroH1Desktop: '56px',
      heroH1Tablet: '40px',
      heroH1Mobile: '32px',
      sectionH2Desktop: '38px',
      sectionH2Mobile: '28px',
      bannerH3: '24px',
      cardH4: '18px',
      cardH4Small: '16.5px',
      eyebrow: '12.5px',
      subHero: '18px',
      subSection: '16.5px',
      body: '14.5px',
      small: '12.5px',
      tag: '11.5px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },
  spacing: {
    sectionPadDesktop: '96px',
    sectionPadMobile: '60px',
    containerMaxWidth: '1200px',
    containerPadDesktop: '32px',
    containerPadMobile: '20px',
    cardPad: '28px',
    cardPadLg: '34px',
    gridGap: '24px',
  },
  radii: {
    sm: '12px',
    md: '18px',
    lg: '28px',
    xl: '32px',
    '2xl': '40px',
    full: '100px',
  },
  shadows: {
    btnPrimary: '0 8px 20px -8px rgba(37,99,235,.6)',
    btnGreen: '0 12px 28px -10px rgba(0,200,150,.55)',
    card: '0 20px 45px -18px rgba(15,23,42,.18)',
    cardHover: '0 22px 40px -22px rgba(15,23,42,.18)',
    stepCirc: '0 10px 24px -14px rgba(15,23,42,.18)',
    toast: '0 20px 40px -12px rgba(0,0,0,.4)',
  },
} as const;

export default tokens;
