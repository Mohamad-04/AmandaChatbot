// Styles for the personalisation onboarding screen.
// Shared with the profile panel's personalisation sub-page where noted.

import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/tokens';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({

  // ── Layout ────────────────────────────────────────────────────────────────

  // Fills the safe area and acts as the root container
  container: {
    flex: 1,
  },

  // Scrollable content area — grows to fill remaining space
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // ── Skip button ───────────────────────────────────────────────────────────

  // Positioned top-right — visible on every step to signal the flow is optional
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#EDE0D4',
  },

  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Progress dots ─────────────────────────────────────────────────────────

  // Row of dots indicating which step the user is on
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 64,
    marginBottom: 40,
  },

  // ── Heading ───────────────────────────────────────────────────────────────

  headingContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    marginBottom: 36,
  },

  // Small uppercase tag above the title e.g. "Getting to know you"
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  // ── Chip (multi-select pill) ──────────────────────────────────────────────

  chip: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 28,
    margin: 5,
    borderWidth: 2,
  },

  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  chipUnselected: {
    backgroundColor: '#EDE0D4',
    borderColor: 'transparent',
  },

  chipTextSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },

  chipTextUnselected: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },

  // ── Mood grid card ────────────────────────────────────────────────────────
  // Each mood option — 2-column grid
  moodCard: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    width: (width - 96) / 2,
  },

  moodCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  moodCardUnselected: {
    backgroundColor: '#EDE0D4',
    borderColor: 'transparent',
  },

  moodEmoji: {
    fontSize: 36,
  },

  moodLabelSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },

  moodLabelUnselected: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },

  // ── Option card (therapy + tone) ──────────────────────────────────────────

  // Full-width card used for single-select steps 4 and 5
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },

  optionCardSelected: {
    backgroundColor: 'rgba(168,122,116,0.12)',
    borderColor: colors.primary,
  },

  optionCardUnselected: {
    backgroundColor: '#EDE0D4',
    borderColor: 'transparent',
  },

  // Circular icon area on the left
  optionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionIconCircleSelected: {
    backgroundColor: colors.primary,
  },

  optionIconCircleUnselected: {
    backgroundColor: 'rgba(168,122,116,0.18)',
  },

  optionSymbolSelected: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },

  optionSymbolUnselected: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },

  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  optionDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 18,
  },

  // Checkmark circle — always rendered, invisible when inactive to avoid layout shift
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  checkCircleSelected: {
    backgroundColor: colors.primary,
  },

  checkCircleUnselected: {
    backgroundColor: 'rgba(168,122,116,0.18)',
  },

  checkIcon: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Bottom controls ───────────────────────────────────────────────────────

  bottomBar: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 14,
  },

  // Continue / Get started button
  continueBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },

  continueBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  continueBtnDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(168,122,116,0.50)',
  },

  continueBtnTextActive: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: 'white',
  },

  continueBtnTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: 'rgba(168,122,116,0.60)',
  },

  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  backBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },

  disclaimer: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },

});
