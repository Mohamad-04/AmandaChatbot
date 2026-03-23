import { StyleSheet, Dimensions } from 'react-native';

export const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.78;

export const C = {
  bg1:        '#DDD0C4',
  bg3:        '#A87A74',
  text:       '#2d1e1c',
  textMuted:  '#6b4e4b',
  textLight:  '#a89290',
  border:     'rgba(168,122,116,0.18)',
  drawerBg:   'rgba(241,227,211,0.98)',
  activeChat: 'rgba(168,122,116,0.16)',
  sendBg:     'rgba(45,30,28,0.12)',
  sendBorder: 'rgba(45,30,28,0.15)',
  danger:     '#c0392b',
};

export const sidebarStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45,30,28,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: C.drawerBg,
    paddingTop: 56,
    borderRightWidth: 1,
    borderRightColor: C.border,
    shadowColor: '#2d1e1c',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 12,
  },
  drawerBrand:       { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  profileBtn:        { padding: 4 },
  profileAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: 'white', fontWeight: '700', fontSize: 14 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 20,
    paddingVertical: 13, paddingHorizontal: 18,
    backgroundColor: C.text, borderRadius: 14,
  },
  newChatIcon:  { color: 'white', fontSize: 18, fontWeight: '300' },
  newChatText:  { color: 'white', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  listHeading: {
    fontSize: 11, fontWeight: '700', color: C.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 20, marginBottom: 4,
  },
  loadingBox: { paddingTop: 32, alignItems: 'center' },
  emptyText:  { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 32, paddingHorizontal: 24 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.08)',
  },
  chatItemActive: { backgroundColor: C.activeChat },
  chatItemInner:  { flex: 1 },
  chatItemTitle:  { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2 },
  chatItemTime:   { fontSize: 12, color: C.textLight },
  chatItemDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: C.bg3, marginLeft: 8 },
});

export const profileStyles = StyleSheet.create({
  panel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.drawerBg,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 8,
  },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backBtnText: { fontSize: 26, color: C.text, lineHeight: 30 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: -0.3 },
  section:      { paddingHorizontal: 20, marginBottom: 4 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textLight,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 6,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.10)',
    gap: 12,
  },
  rowIcon:    { fontSize: 16, width: 24, textAlign: 'center' },
  rowLabel:   { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  rowValue:   { fontSize: 13, color: C.textMuted, maxWidth: 140, textAlign: 'right' },
  rowChevron: { fontSize: 18, color: C.textLight, marginLeft: 4 },
  signOutWrapper: {
    marginTop: 'auto',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderWidth: 1, borderColor: 'rgba(192,57,43,0.18)',
    borderRadius: 12,
  },
  signOutIcon: { fontSize: 16, color: '#c0392b' },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#c0392b' },
});