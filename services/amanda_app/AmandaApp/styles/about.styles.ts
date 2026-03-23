import {
  StyleSheet,
  Dimensions,
} from 'react-native';


const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = 500; // Adjust this value based on your design needs

export const C = {
  bg:          '#353232',
  cardBorder:  '#FCE4EC(255,255,255,0.10)',
  text:        'rgba(255,255,255,0.92)',
  textMuted:   'rgba(255,255,255,0.55)',
  accent:      '#B07D62',
  accentLight: 'rgba(176,125,98,0.15)',
  btnDark:     '#2D2D2D',
};

  /*bgTop:        '#FFF0F3',   // very soft blush background
  bgBot:        '#FCE4EC',   // slightly deeper blush
  rose:         '#E8637A*/

export const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  skipText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  slide: {
    width,
    height: SLIDE_HEIGHT,        // fixed height so all slides render correctly
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 16,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accent,
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
    color: C.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: C.textMuted,
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
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  dotActive: {
    width: 24,
    backgroundColor: C.accent,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: C.btnDark,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  continueBtnLast: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  continueBtnText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },

});