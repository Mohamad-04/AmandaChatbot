import { StyleSheet, Dimensions } from 'react-native';
import { colors } from '../constants/tokens';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({

  // ── Top bar ──────────────────────────────────────────────────────────────
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    gap: 5,
    padding: 4,
  },
  menuLine: {
    width: 22,
    height: 2,
    backgroundColor: colors.text,
    borderRadius: 2,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  backBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.borderError,
  },
  signOutBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Overlay + sheet ──────────────────────────────────────────────────────
  dimOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(45,30,28,0.35)',
  },
  sheet: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: width * 0.72,
    backgroundColor: colors.bgBase,
    paddingTop: 70,
    paddingBottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    borderRightWidth: 1,
    borderColor: colors.borderCard,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sheetBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Scrollable content ───────────────────────────────────────────────────
  sheetScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    marginBottom: 4,
    gap: 10,
  },
  rowIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  rowChevron: {
    fontSize: 18,
    color: colors.textMuted,
  },

  // ── Auth section at bottom ────────────────────────────────────────────────
  authSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: colors.borderCard,
    gap: 10,
  },
  authBtnPrimary: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.btnPrimary,
    alignItems: 'center',
  },
  authBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  authBtnSecondary: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.borderCard,
    alignItems: 'center',
  },
  authBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  authBtnDanger: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.borderError,
    alignItems: 'center',
  },
  authBtnDangerText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});
