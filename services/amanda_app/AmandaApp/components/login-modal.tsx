// Modal shown to anonymous users — blocks access to chat until logged in.
// No dismiss option: user must sign up or log in to continue.

import React, { useRef, useEffect } from 'react';
import { Text, TouchableOpacity, Modal, Animated, Image } from 'react-native';
import { s } from '../styles/login-modal.styles';

interface LoginModalProps {
  visible:  boolean;
  onLogin:  () => void;
  onSignup: () => void;
  onClose:  () => void;
}

export default function LoginModal({ visible, onLogin, onSignup }: LoginModalProps) {
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
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      <Animated.View style={[s.modalBackdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[s.modalCard, { transform: [{ translateY: slideAnim }] }]}>

          <Image
            source={require('../assets/images/Amanda.jpg')}
            style={s.modalAvatar}
          />

          <Text style={s.modalTitle}>Sign in to continue</Text>
          <Text style={s.modalSubtitle}>
            Amanda is only available to registered users.{'\n\n'}
            Create a free account or log in to start your conversation.
          </Text>

          <TouchableOpacity style={s.modalBtnPrimary} onPress={onSignup} activeOpacity={0.85}>
            <Text style={s.modalBtnPrimaryText}>Create an account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.modalBtnSecondary} onPress={onLogin} activeOpacity={0.85}>
            <Text style={s.modalBtnSecondaryText}>Log in</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}