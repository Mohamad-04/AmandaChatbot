// Signup screen — renders the registration form and animations only.
// All validation and API logic is delegated to useAuth hook.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable,
  SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/signup.styles';
import { theme } from '../constants/theme';
import { colors } from '../constants/tokens';
import { PasswordRequirements } from '../components/password-requirements';

export default function SignupScreen() {
  const router = useRouter();
  const { loading, error, handleSignup } = useAuth();

  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordRef        = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const shakeAnim          = useRef(new Animated.Value(0)).current;
  const fadeAnim           = useRef(new Animated.Value(0)).current;
  const slideAnim          = useRef(new Animated.Value(30)).current;

  // Fade + slide in the form on first render
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Shakes the card to signal a failed signup attempt
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPressSignup = async () => {
    const err = await handleSignup(email, password, confirmPassword);
    if (err) shake();
  };

  return (
    <Background>
      <View style={styles.screen}>
        <SafeAreaView style={{ flex: 1 }}>
          <Navbar showBack backTo="/" />

          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                <View style={styles.heroText}>
                  <Text style={styles.heroGreeting}>Join us today</Text>
                  <Text style={styles.heroTitle}>
                    Create your{'\n'}account
                    <Text style={styles.heroTitleAccent}> ♡</Text>
                  </Text>
                </View>

                <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <InputField
                      icon="✉️"
                      placeholder="your@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <InputField
                      icon="🔒"
                      placeholder="At least 8 characters"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      inputRef={passwordRef}
                    />
                    <PasswordRequirements password={password} />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm password</Text>
                    <InputField
                      icon="🔒"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={onPressSignup}
                      inputRef={confirmPasswordRef}
                    />
                  </View>

                  {error !== '' && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorIcon}>⚠️</Text>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {/* Pressable + LinearGradient — pressed state matches website hover:
                      gradient(180deg, #C9A29D, #A87A74), default is dark brown */}
                  <Pressable
                    onPress={onPressSignup}
                    disabled={loading}
                    style={[styles.btn, loading && styles.btnDisabled, { padding: 0, overflow: 'hidden' }]}
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={pressed
                          ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2]
                          : [colors.btnPrimary, colors.btnPrimary]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.btnInner}
                      >
                        {loading
                          ? <ActivityIndicator color={theme.colors.white} size="small" />
                          : <Text style={styles.btnText}>Create account</Text>
                        }
                      </LinearGradient>
                    )}
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                      <Text style={styles.footerLink}> Sign in</Text>
                    </TouchableOpacity>
                  </View>

                </Animated.View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Background>
  );
}
