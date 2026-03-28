// Styles for the login prompt modal shown to anonymous users.

import { StyleSheet } from 'react-native';
import { chatColors as C } from '../constants/theme';

export const s = StyleSheet.create({
  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(45,30,28,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard:             { width: '100%', backgroundColor: 'rgba(241,227,211,0.97)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', paddingHorizontal: 28, paddingTop: 36, paddingBottom: 32, alignItems: 'center', shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 16 },
  modalAvatar:           { width: 80, height: 80, borderRadius: 40, marginBottom: 20, borderWidth: 2, borderColor: 'rgba(168,122,116,0.35)' },
  modalTitle:            { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: -0.4 },
  modalSubtitle:         { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  modalBtnPrimary:       { width: '100%', paddingVertical: 15, borderRadius: 14, backgroundColor: C.dark, alignItems: 'center', marginBottom: 10 },
  modalBtnPrimaryText:   { color: 'white', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  modalBtnSecondary:     { width: '100%', paddingVertical: 15, borderRadius: 14, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(45,30,28,0.20)', alignItems: 'center', marginBottom: 20 },
  modalBtnSecondaryText: { color: C.text, fontSize: 15, fontWeight: '600' },
  modalDivider:          { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  modalDividerLine:      { flex: 1, height: 1, backgroundColor: 'rgba(168,122,116,0.20)' },
  modalDividerText:      { marginHorizontal: 12, fontSize: 13, color: C.textLight },
  backText:              { fontSize: 14, color: C.textMuted, fontWeight: '600' },
});