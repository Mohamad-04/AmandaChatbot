// Theme re-exports — kept for backwards compatibility.
// All values now live in tokens.ts — edit there, not here.

import { colors, gradients } from './tokens';

export const theme = {
  colors: {
    primary:      colors.primary,
    text:         colors.text,
    textMuted:    colors.textMuted,
    glass:        colors.bgGlass,
    glassStrong:  colors.bgGlassStrong,
    border:        colors.border,
    borderCard:    colors.borderCard,
    borderFocus:   colors.borderFocus,
    borderError:   colors.borderError,
    borderSuccess: colors.borderSuccess,
    inputBg:       colors.inputBg,
    btnPrimary:    colors.btnPrimary,
    placeholder:   colors.textLight,
    error:         colors.error,
    errorBg:       colors.errorBg,
    success:       colors.success,
    successBg:     colors.successBg,
    white:         colors.white,
    bgBase:       colors.bgBase,
    bgTint:       'rgba(168, 122, 116, 0.15)',
    gradient:     gradients.background,
  },
};

export const chatColors = {
  bg1:         colors.bgBase,
  bg3:         colors.primary,
  text:        colors.text,
  textMuted:   colors.textMuted,
  textLight:   colors.textLight,
  cardBorder:  colors.border,
  userBubble:  colors.bgGlass,
  asstBubble:  colors.bgGlass,
  inputBg:     'rgba(241,227,211,0.55)',
  inputBorder: 'rgba(168,122,116,0.20)',
  sendBg:      'rgba(45,30,28,0.12)',
  sendBorder:  'rgba(45,30,28,0.15)',
  dark:        colors.text,
};
