// All styles for the chat screen and its sub-components.
// Kept in a separate file to keep chat.tsx focused on structure and logic.

import { StyleSheet, Platform } from 'react-native';
import { chatColors as C } from '../constants/theme';

export const s = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────────────
  safe:    { flex: 1, backgroundColor: C.bg1 },
  flex:    { flex: 1 },
  bgLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg1 },

  // ── Loading screen ───────────────────────────────────────────────────
  loadingContainer: { flex: 1, backgroundColor: C.bg1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:      { color: C.textMuted, fontSize: 15, fontWeight: '500' },

  // ── Header ───────────────────────────────────────────────────────────
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(241,227,211,0.40)', borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.15)' },
  headerBtn:          { width: 56, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  headerTitleBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle:        { fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: -0.3, maxWidth: 200 },
  headerTitleChevron: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  headerSignInBtn:    { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.sendBg, borderWidth: 1, borderColor: C.sendBorder, borderRadius: 20 },
  headerSignInText:   { fontSize: 13, fontWeight: '600', color: C.text },
  hLine:              { width: 20, height: 2, backgroundColor: C.text, borderRadius: 2 },

  // ── Anonymous banner ─────────────────────────────────────────────────
  anonBanner:     { backgroundColor: 'rgba(168,122,116,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.18)', paddingHorizontal: 16, paddingVertical: 10 },
  anonBannerText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
  anonBannerLink: { color: C.text, fontWeight: '600', textDecorationLine: 'underline' },

  // ── Message list ─────────────────────────────────────────────────────
  listContent:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, flexGrow: 1 },
  messageRow:     { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAsst: { justifyContent: 'flex-start' },
  avatar:         { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginBottom: 2, flexShrink: 0 },
  bubble:         { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1 },
  bubbleUser:     { backgroundColor: C.userBubble, borderColor: C.cardBorder, borderRadius: 20, borderBottomRightRadius: 4 },
  bubbleAsst:     { backgroundColor: C.asstBubble, borderColor: C.cardBorder, borderRadius: 20, borderBottomLeftRadius: 4 },
  bubbleText:     { color: C.text, fontSize: 15, lineHeight: 22 },
  cursor:         { color: C.textMuted, opacity: 0.7 },

  // ── Empty state ──────────────────────────────────────────────────────
  emptyState:    { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle:    { fontSize: 32, fontWeight: '600', color: C.text, marginBottom: 10, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 15, color: C.textMuted, marginBottom: 32, textAlign: 'center' },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip:          { backgroundColor: 'rgba(241,227,211,0.60)', borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  chipText:      { color: '#5a3d3a', fontSize: 14 },

  // ── Text input bar ───────────────────────────────────────────────────
  inputArea:       { paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  inputBox:        { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  inputBoxFocused: { borderColor: 'rgba(168,122,116,0.40)', backgroundColor: 'rgba(241,227,211,0.72)' },
  input:           { color: C.text, fontSize: 15, lineHeight: 22, maxHeight: 120, minHeight: 24, paddingTop: 0, paddingBottom: 0 },
  inputActions:    { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sendBtn:         { width: 34, height: 34, borderRadius: 8, backgroundColor: C.sendBg, borderWidth: 1, borderColor: C.sendBorder, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnIcon:     { color: C.text, fontSize: 18, fontWeight: '600', lineHeight: 22 },
  disclaimer:      { textAlign: 'center', fontSize: 11, color: C.textLight, marginTop: 8 },

  // ── Voice buttons in input bar ───────────────────────────────────────
  voiceBtns:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceToTextBtn:  { width: 34, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: C.bg3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  voiceToTextIcon: { fontSize: 18 },
  voiceChatBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' },

  // ── Transcription bar ────────────────────────────────────────────────
  vttBar:              { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, minHeight: 54 },
  vttBtn:              { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  vttX:                { fontSize: 16, color: C.textMuted, fontWeight: '600' },
  vttConfirm:          { backgroundColor: C.bg3 },
  vttTick:             { fontSize: 18, color: 'white', fontWeight: '700' },
  vttMiddle:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  vttTranscribingText: { fontSize: 13, color: C.textMuted },

  // ── Voice conversation bar ───────────────────────────────────────────
  voiceBar:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 16 : 24, alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(168,122,116,0.15)', backgroundColor: 'rgba(241,227,211,0.25)' },
  voiceStatus:    { fontSize: 15, fontWeight: '600', color: C.text, textAlign: 'center' },
  voiceHint:      { fontSize: 12, color: C.textMuted, textAlign: 'center' },
  voiceCancelBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.sendBg },
  voiceCancelText:{ fontSize: 13, color: C.textMuted, fontWeight: '500' },

  // ── Chat options menu ────────────────────────────────────────────────
  menuOverlay:   { flex: 1, backgroundColor: 'rgba(45,30,28,0.35)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100 },
  menuCard:      { width: 220, backgroundColor: 'rgba(241,227,211,0.98)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(168,122,116,0.22)', overflow: 'hidden', shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 12 },
  menuHeading:   { fontSize: 13, fontWeight: '600', color: C.textLight, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  menuSeparator: { height: 1, backgroundColor: 'rgba(168,122,116,0.12)' },
  menuRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  menuRowIcon:   { fontSize: 16 },
  menuRowText:   { fontSize: 15, fontWeight: '500', color: C.text },

  // ── Rename modal ─────────────────────────────────────────────────────
  renameCard:          { width: '85%', backgroundColor: 'rgba(241,227,211,0.98)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,122,116,0.22)', padding: 24, shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 12 },
  renameTitle:         { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16, letterSpacing: -0.3 },
  renameInput:         { backgroundColor: 'rgba(168,122,116,0.10)', borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, marginBottom: 16 },
  renameActions:       { flexDirection: 'row', gap: 10 },
  renameBtnCancel:     { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(45,30,28,0.15)', alignItems: 'center' },
  renameBtnCancelText: { fontSize: 15, fontWeight: '500', color: C.textMuted },
  renameBtnSave:       { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.dark, alignItems: 'center' },
  renameBtnSaveText:   { fontSize: 15, fontWeight: '700', color: 'white' },
});