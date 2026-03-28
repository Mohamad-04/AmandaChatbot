import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({

  screen: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  // ── Navbar ────────────────────────────────────────────────────────────
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

  brand: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  backBtnText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Layout ────────────────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Hero text ─────────────────────────────────────────────────────────
  heroText: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },

  heroGreeting: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 34,
  },

  // ── Card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    gap: 18,
  },

  // ── Form ──────────────────────────────────────────────────────────────
  formGroup: {
    gap: 8,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },

  inputWrapper: {
    flexDirection: 'row',      // ← so icon + input sit side by side
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 227, 211, 0.55)',
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },

  inputWrapperFocused: {
    borderColor: 'rgba(168, 122, 116, 0.55)',
    backgroundColor: theme.colors.glassStrong,
  },

  // ── ADD THIS — was missing, caused the crash ──────────────────────────
  inputIcon: {
    fontSize: 16,
  },

  input: {
    flex: 1,               // ← takes remaining width after icon
    fontSize: 15,
    color: theme.colors.text,
  },

  // ── Forgot password ───────────────────────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
  },

  forgotText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },

  // ── Messages ──────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(192, 57, 43, 0.30)',
    borderRadius: 10,
    padding: 12,
  },

  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    textAlign: 'center',
  },

  successBox: {
    backgroundColor: 'rgba(39, 127, 82, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(39, 127, 82, 0.30)',
    borderRadius: 10,
    padding: 12,
  },

  successText: {
    color: theme.colors.success,
    fontSize: 13,
    textAlign: 'center',
  },

  // ── Button ────────────────────────────────────────────────────────────
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  btnText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    marginTop: 24,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  footerText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },

  footerLink: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  // ── Sidebar ───────────────────────────────────────────────────────────
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
    backgroundColor: '#2D1E1C',
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },

  sheetLinkText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
  },
});