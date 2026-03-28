// Forgot password screen — shows an email form or success message.
// All validation and API logic is delegated to useAuth hook.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/login.styles';
import { theme } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { loading, error, handleForgotPassword } = useAuth();

  const [email, setEmail]     = useState('');
  const [success, setSuccess] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fade + slide in on first render
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Shakes the card to signal invalid input
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPressSubmit = async () => {
    const err = await handleForgotPassword(email);
    if (err) shake();
    else setSuccess(true);
  };

  return (
    <Background>
      <View style={styles.screen}>
        <SafeAreaView style={{ flex: 1 }}>
          <Navbar showBack backTo="/login" />

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
                  <Text style={styles.heroGreeting}>Account recovery</Text>
                  <Text style={styles.heroTitle}>Reset your{'\n'}password</Text>
                </View>

                <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

                  {success ? (
                    // Reset link sent — always shown regardless of whether email exists
                    <>
                      <View style={styles.successBox}>
                        <Text style={styles.successText}>
                          If that email is registered, a reset link has been sent. Check your inbox.
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
                        <Text style={styles.btnText}>Back to Login</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Email input form
                    <>
                      <Text style={styles.label}>
                        Enter the email address linked to your account and we'll send you a reset link.
                      </Text>

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <InputField
                          icon="✉️"
                          placeholder="your@email.com"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          returnKeyType="done"
                          onSubmitEditing={onPressSubmit}
                        />
                      </View>

                      {error !== '' && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={onPressSubmit}
                        disabled={loading}
                      >
                        {loading
                          ? <ActivityIndicator color={theme.colors.white} size="small" />
                          : <Text style={styles.btnText}>Send Reset Link</Text>
                        }
                      </TouchableOpacity>

                      <View style={styles.footer}>
                        <Text style={styles.footerText}>Remember your password?</Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                          <Text style={styles.footerLink}> Sign in</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                </Animated.View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Background>
  );
}
