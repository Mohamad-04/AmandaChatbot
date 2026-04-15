import {
  StyleSheet,
  Dimensions,
} from 'react-native';



const { width } = Dimensions.get('window');


// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  text:       'rgba(255,255,255,0.92)',
  textMuted:  'rgba(255,255,255,0.62)',
  cardBg:     'rgba(245, 243, 243, 0.35)',
  cardBorder: 'rgba(255,255,255,0.10)',
  btnDark:    '#1C1A1C',
  btnText:    '#AAAAAA',
};

export const styles = StyleSheet.create({

  // Full screen background
  bg: {
    flex: 1,
  },


  // ── Navbar ────────────────────────────────────────────────────────────────
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // left group vs right group
    paddingHorizontal: 24,
    paddingVertical: 18,
  },


  // Right group: login + signup
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navLink: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.90)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navSignupBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  navSignupText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Glass card
  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 50,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 244, 0.35)',
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: C.btnDark,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 50,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: C.btnText,
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  dot: {
    opacity: 0.6,
  },

 

});