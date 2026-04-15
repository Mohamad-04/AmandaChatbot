import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/tokens';

const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = 500;

// Re-exported so about.tsx can reference accent color directly if needed
export const C = { accent: colors.primary };

export const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },

  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  slide: {
    width,
    height: SLIDE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 16,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 42,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderCard,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: colors.btnPrimary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  continueBtnLast: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  continueBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
