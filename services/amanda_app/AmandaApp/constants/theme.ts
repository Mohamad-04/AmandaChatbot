

// Constant background for chat screen but users can toggle backgroun
// constant background for other pages

export const theme = {
  colors: {
    primary:      '#A87A74',
    text:         '#2D1E1C',
    textMuted:    '#6B4E4B',
    glass:        'rgba(241, 227, 211, 0.6)',
    glassStrong:  'rgba(241, 227, 211, 0.8)',
    border:       'rgba(168, 122, 116, 0.28)',
    placeholder:  '#A89290',
    error:        '#A0291C',
    errorBg:      'rgba(192, 57, 43, 0.08)',
    success:      '#1E6B44',
    white:        '#FFFFFF',

    // ── Background & gradient ──────────────────────────────────────────
    bgBase:       '#DDD0C4',              // used by Background component
    bgTint:       'rgba(168, 122, 116, 0.15)', // subtle overlay in Background
    gradient:     ['#DDD0C4', '#C8A9A4', '#A87A74', '#6b3e38'] as const,
  },
};

// These are chat-specific colours — add to your existing theme.ts
export const chatColors = {
  bg1:         '#DDD0C4',
  bg3:         '#A87A74',
  text:        '#2d1e1c',
  textMuted:   '#6b4e4b',
  textLight:   '#a89290',
  cardBorder:  'rgba(168,122,116,0.25)',
  userBubble:  'rgba(241,227,211,0.65)',
  asstBubble:  'rgba(241,227,211,0.65)',
  inputBg:     'rgba(241,227,211,0.55)',
  inputBorder: 'rgba(168,122,116,0.20)',
  sendBg:      'rgba(45,30,28,0.12)',
  sendBorder:  'rgba(45,30,28,0.15)',
  dark:        '#2d1e1c',
};