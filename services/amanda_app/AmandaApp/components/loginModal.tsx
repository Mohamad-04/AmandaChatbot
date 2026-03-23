import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated, StyleSheet,
} from 'react-native';

const C = {
  bg3:        '#A87A74',
  text:       '#2d1e1c',
  textMuted:  '#6b4e4b',
  textLight:  '#a89290',
  cardBorder: 'rgba(168,122,116,0.25)',
  dark:       '#2d1e1c',
};

type Props = {
  visible: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onAnonymous: () => void;
};

export default function loginModal({ visible, onLogin, onSignup, onAnonymous }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(60);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.modalBackdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[s.modalCard, { transform: [{ translateY: slideAnim }] }]}>

          <View style={s.modalAvatar}>
            <Text style={s.modalAvatarText}>A</Text>
          </View>

          <Text style={s.modalTitle}>Meet Amanda</Text>
          <Text style={s.modalSubtitle}>
            Your personal space to talk, reflect, and feel heard.{'\n\n'}
            Create an account to save your conversations and pick up where you left off.
          </Text>

          <TouchableOpacity style={s.modalBtnPrimary} onPress={onSignup} activeOpacity={0.85}>
            <Text style={s.modalBtnPrimaryText}>Create a free account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.modalBtnSecondary} onPress={onLogin} activeOpacity={0.85}>
            <Text style={s.modalBtnSecondaryText}>Log in</Text>
          </TouchableOpacity>

          <View style={s.modalDivider}>
            <View style={s.modalDividerLine} />
            <Text style={s.modalDividerText}>or</Text>
            <View style={s.modalDividerLine} />
          </View>

          <TouchableOpacity onPress={onAnonymous} activeOpacity={0.7}>
            <Text style={s.modalAnonText}>Continue without an account</Text>
          </TouchableOpacity>

          <Text style={s.modalAnonNote}>
            Your conversation won't be saved if you continue anonymously.
          </Text>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop:        { flex: 1, backgroundColor: 'rgba(45,30,28,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalCard:            { width: '100%', backgroundColor: 'rgba(241,227,211,0.97)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', paddingHorizontal: 28, paddingTop: 36, paddingBottom: 32, alignItems: 'center', shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 16 },
  modalAvatar:          { width: 72, height: 72, borderRadius: 36, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalAvatarText:      { color: 'white', fontSize: 28, fontWeight: '700' },
  modalTitle:           { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: -0.4 },
  modalSubtitle:        { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  modalBtnPrimary:      { width: '100%', paddingVertical: 15, borderRadius: 14, backgroundColor: C.dark, alignItems: 'center', marginBottom: 10 },
  modalBtnPrimaryText:  { color: 'white', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  modalBtnSecondary:    { width: '100%', paddingVertical: 15, borderRadius: 14, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(45,30,28,0.20)', alignItems: 'center', marginBottom: 20 },
  modalBtnSecondaryText:{ color: C.text, fontSize: 15, fontWeight: '600' },
  modalDivider:         { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  modalDividerLine:     { flex: 1, height: 1, backgroundColor: 'rgba(168,122,116,0.20)' },
  modalDividerText:     { marginHorizontal: 12, fontSize: 13, color: C.textLight },
  modalAnonText:        { fontSize: 14, color: C.textMuted, fontWeight: '500', textDecorationLine: 'underline', marginBottom: 10 },
  modalAnonNote:        { fontSize: 12, color: C.textLight, textAlign: 'center', lineHeight: 17 },
});