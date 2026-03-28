// Login screen — renders the form and animations only.
// All logic is delegated to useAuth hook.

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/login.styles';
import { theme } from '../constants/theme';
import { useState } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const { loading, error, handleLogin } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const passwordRef = useRef<TextInput>(null);
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;

  // Fade + slide in the form on first render
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Shakes the card left-right to signal a failed login attempt
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPressLogin = async () => {
    const err = await handleLogin(email, password);
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
                  <Text style={styles.heroGreeting}>Welcome back</Text>
                  <Text style={styles.heroTitle}>Good to see{'\n'}you again ♡</Text>
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
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={onPressLogin}
                      inputRef={passwordRef}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => router.push('/forgot-password')}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {error !== '' && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={onPressLogin}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color={theme.colors.white} size="small" />
                      : <Text style={styles.btnText}>Sign in</Text>
                    }
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>New here?</Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                      <Text style={styles.footerLink}>Create an account</Text>
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