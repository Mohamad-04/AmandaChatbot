import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Design tokens ─────────────────────────────────────────────────────────
export const C = {
  // Warm pink palette
  bgTop:        '#FFF0F3',   // very soft blush background
  bgBot:        '#FCE4EC',   // slightly deeper blush
  rose:         '#E8637A',   // primary rose — buttons, accents
  roseDark:     '#C94B62',   // pressed state
  roseLight:    '#F4A0AE',   // soft rose for borders/placeholders
  roseMuted:    '#F9D0D8',   // very light rose for input bg
  white:        '#FFFFFF',
  text:         '#2D1B20',   // warm dark, not harsh black
  textMuted:    '#9E7B82',   // muted warm brown-pink
  placeholder:  '#C4A0A8',
  border:       '#F0C8D0',
  error:        '#D64545',
  errorBg:      '#FFF0F0',
  success:      '#4CAF7D',
  // Navbar (matches landing dark style)
  navBg:        'transparent',
  navText:      '#2D1B20',
  cardBorder:   'rgba(232,99,122,0.15)',
};

export const styles = StyleSheet.create({

  // ── Screen ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: C.bgTop,
  },

  safe: {
    flex: 1,
  },

  // ── Navbar — hamburger left, back right ─────────────────────────────────
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
    backgroundColor: C.rose,
    borderRadius: 2,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: C.rose,
    letterSpacing: 0.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.roseMuted,
    borderWidth: 1,
    borderColor: C.border,
  },
  backBtnText: {
    color: C.rose,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Scroll / keyboard view ───────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Hero text above card ─────────────────────────────────────────────────
  heroText: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  heroGreeting: {
    fontSize: 13,
    fontWeight: '600',
    color: C.roseLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroTitleAccent: {
    color: C.rose,
  },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 28,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 18,
  },

  // ── Form fields ──────────────────────────────────────────────────────────
  formGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.roseMuted,
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: C.rose,
    backgroundColor: C.white,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    paddingVertical: 0,
  },

  // ── Forgot password ──────────────────────────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
    color: C.rose,
    fontWeight: '600',
  },

  // ── Error ────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    padding: 12,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    flex: 1,
  },

  // ── Login button ─────────────────────────────────────────────────────────
  btn: {
    backgroundColor: C.rose,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  btnDisabled: {
    backgroundColor: C.roseLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },

  // ── Footer — sign up link ─────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  footerLink: {
    fontSize: 14,
    color: C.rose,
    fontWeight: '700',
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  dimOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(45,27,32,0.45)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.72,
    backgroundColor: '#2D1B20',
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: C.rose,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(232,99,122,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,99,122,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: C.rose,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 28,
  },
  sheetLinks: {
    gap: 8,
  },
  sheetLink: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(232,99,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,99,122,0.12)',
  },
  sheetLinkText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  dropdownArrow: {
    color: C.rose,
    fontSize: 12,
  },
  dropdownChildren: {
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownChild: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: 8,
  },
  dropdownIndent: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(232,99,122,0.30)',
    borderRadius: 1,
    marginRight: 12,
    marginLeft: 8,
  },
  dropdownChildText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 14,
    fontWeight: '400',
  },
});