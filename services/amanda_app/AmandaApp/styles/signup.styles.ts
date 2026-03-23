import {
  StyleSheet,
  Dimensions,
} from 'react-native';


const { width } = Dimensions.get('window');


// ─── Design tokens — same as login screen ─────────────────────────────────────
export const C = {
  primary:     '#0066CC',
  text:        '#1a1a1a',
  textMuted:   '#6B7280',
  placeholder: '#9CA3AF',
  border:      '#E5E7EB',
  error:       '#DC2626',
  errorBg:     '#FEE2E2',
  white:       '#FFFFFF',
  btnDisabled: '#93C5FD',
};

export const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#764ba2',
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 40,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    gap: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 40,
    fontWeight: '700',
    color: C.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },

  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
  },
  input: {
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: C.text,
    backgroundColor: '#fff',
  },

  errorBox: {
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.error,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: C.error,
    fontSize: 14,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: C.btnDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: C.border,
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  footerLink: {
    fontSize: 14,
    color: C.primary,
    fontWeight: '600',
  },

});