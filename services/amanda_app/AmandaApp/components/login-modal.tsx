// Modal shown to anonymous users prompting them to sign up or log in.
// Slides up on appear, fades backdrop behind it.

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { s } from '../styles/login-modal.styles';

interface LoginModalProps {
  visible:  boolean;
  onLogin:  () => void;
  onSignup: () => void;
  onClose:  () => void;
}

export default function LoginModal({ visible, onLogin, onSignup, onClose }: LoginModalProps) {
  const router    = useRouter();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  // Animate in on show, reset instantly on hide
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

  // Close modal before navigating so the transition feels clean
  const handleLogin  = () => { onClose(); onLogin();  };
  const handleSignup = () => { onClose(); onSignup(); };
  const handleBack   = () => { onClose(); router.push('/'); };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.modalBackdrop, { opacity: fadeAnim }]}>
        <Animated.View style={[s.modalCard, { transform: [{ translateY: slideAnim }] }]}>

          <Image
            source={require('../assets/images/Amanda.jpg')}
            style={s.modalAvatar}
          />

          <Text style={s.modalTitle}>Meet Amanda</Text>
          <Text style={s.modalSubtitle}>
            Your personal space to talk, reflect, and feel heard.{'\n\n'}
            Log in or create an account to start talking with Amanda.
          </Text>

          <TouchableOpacity style={s.modalBtnPrimary} onPress={handleSignup} activeOpacity={0.85}>
            <Text style={s.modalBtnPrimaryText}>Create an account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.modalBtnSecondary} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={s.modalBtnSecondaryText}>Log in</Text>
          </TouchableOpacity>

          <View style={s.modalDivider}>
            <View style={s.modalDividerLine} />
            <Text style={s.modalDividerText}>or</Text>
            <View style={s.modalDividerLine} />
          </View>

          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <Text style={s.backText}>Maybe later</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}