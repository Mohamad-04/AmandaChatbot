import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const C = {
  sheetBg:     '#643f3f',
  brand:       '#E8637A',
  text:        'rgba(255,255,255,0.88)',
  textMuted:   'rgba(255,255,255,0.55)',
  textLight:   'rgba(255,255,255,0.35)',
  border:      'rgba(232,99,122,0.14)',
  rowBg:       'rgba(232,99,122,0.07)',
  danger:      '#e05c5c',
  dangerBg:    'rgba(224,92,92,0.10)',
  dangerBorder:'rgba(224,92,92,0.22)',
  primaryBg:   '#E8637A',
};

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
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0efef',
    borderWidth: 1,
    borderColor: '#F0C8D0',
  },
  backBtnText: {
    color: '#313131',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(224,92,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224,92,92,0.28)',
  },
  signOutBtnText: {
    color: '#e05c5c',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Overlay + sheet ──────────────────────────────────────────────────────
  dimOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(45,27,32,0.45)',
  },
  sheet: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: width * 0.72,
    backgroundColor: C.sheetBg,
    paddingTop: 70,
    paddingBottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
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
    color: C.brand,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(240,172,182,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: C.brand,
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
    color: C.textLight,
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
    backgroundColor: C.rowBg,
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
    color: C.text,
  },
  rowChevron: {
    fontSize: 18,
    color: C.textMuted,
  },

  // ── Auth section at bottom ────────────────────────────────────────────────
  authSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  authBtnPrimary: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
  },
  authBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  authBtnSecondary: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  authBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  authBtnDanger: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    alignItems: 'center',
  },
  authBtnDangerText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.danger,
  },
});
