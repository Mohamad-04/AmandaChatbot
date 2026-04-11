// Profile setup screen — shown once after email verification, before entering chat.
// Collects first name (required), last name and age range (both optional).
// Data is saved to AsyncStorage as a placeholder until the backend profile
// endpoint is ready. When ready: swap AsyncStorage in handleContinue() for
// a PATCH /api/users/profile call.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, SafeAreaView,
  Animated, ScrollView, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Background from '../components/background';
import Navbar     from '../components/navbar';
import InputField from '../components/input-field';
import { styles } from '../styles/login.styles';
import { colors } from '../constants/tokens';
import { theme }  from '../constants/theme';

const PROFILE_KEY = '@amanda_profile';
const AGE_RANGES  = ['<18', '18–24', '25–34', '35–44', '45+'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [firstName,     setFirstName]     = useState('');
  const [lastName,      setLastName]      = useState('');
  const [ageRange,      setAgeRange]      = useState('');
  const [showAgePicker, setShowAgePicker] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Save profile locally then go to login with email pre-filled.
  // The user only needs to enter their password — one step to get into chat.
  // TODO: once the backend returns a session on email verification, replace
  // router.replace('/login') with router.replace('/chat') directly.
  const handleContinue = async () => {
    await AsyncStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), ageRange }),
    ).catch(() => {});
    router.replace('/chat');
  };

  const canContinue = firstName.trim().length > 0;

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <Navbar showBack backTo="/login" />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              {/* Hero text */}
              <View style={styles.heroText}>
                <Text style={styles.heroGreeting}>One more thing</Text>
                <Text style={styles.heroTitle}>What should{'\n'}Amanda call you?</Text>
              </View>

              {/* Form card — matches verify-email and signup card style */}
              <View style={styles.card}>

                {/* First name — required */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    First name <Text style={{ color: colors.primary }}>*</Text>
                  </Text>
                  <InputField
                    icon="👤"
                    placeholder="Your first name"
                    value={firstName}
                    onChangeText={setFirstName}
                    returnKeyType="next"
                    textContentType="givenName"
                  />
                </View>

                {/* Last name — optional */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Last name{' '}
                    <Text style={{ color: theme.colors.placeholder, fontWeight: '400' }}>(optional)</Text>
                  </Text>
                  <InputField
                    icon="👤"
                    placeholder="Your last name"
                    value={lastName}
                    onChangeText={setLastName}
                    returnKeyType="done"
                    textContentType="familyName"
                  />
                </View>

                {/* Age range — optional dropdown */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Age range{' '}
                    <Text style={{ color: theme.colors.placeholder, fontWeight: '400' }}>(optional)</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      { justifyContent: 'space-between' },
                    ]}
                    onPress={() => setShowAgePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>🎂</Text>
                      <Text style={{ fontSize: 15, color: ageRange ? colors.text : colors.textLight }}>
                        {ageRange || 'Select age range'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: colors.textLight }}>⌄</Text>
                  </TouchableOpacity>
                </View>

                {/* Continue button */}
                <Pressable
                  style={[styles.btn, !canContinue && styles.btnDisabled]}
                  onPress={handleContinue}
                  disabled={!canContinue}
                >
                  {({ pressed }) => (
                    <LinearGradient
                      colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                      style={styles.btnInner}
                    >
                      <Text style={styles.btnText}>Get started ✦</Text>
                    </LinearGradient>
                  )}
                </Pressable>

              </View>

              {/* Skip — lets user go straight to chat without filling anything in */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  You can always update this later in{' '}
                  <Text style={styles.footerLink}>Settings</Text>
                </Text>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Age range picker modal */}
        <Modal
          visible={showAgePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAgePicker(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(45,30,28,0.50)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
            activeOpacity={1}
            onPress={() => setShowAgePicker(false)}
          >
            <View style={{ width: '100%', backgroundColor: '#FDFAF7', borderRadius: 18, padding: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textLight, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
                Select Age Range
              </Text>
              {AGE_RANGES.map(range => (
                <TouchableOpacity
                  key={range}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4,
                    backgroundColor: ageRange === range ? 'rgba(168,122,116,0.14)' : 'transparent',
                  }}
                  onPress={() => { setAgeRange(range); setShowAgePicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 15, color: ageRange === range ? colors.primary : colors.text, fontWeight: ageRange === range ? '700' : '500' }}>
                    {range}
                  </Text>
                  {ageRange === range && <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </Background>
  );
}
