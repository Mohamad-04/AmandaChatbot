// Verify email screen — auto-verifies on load if token present,
// otherwise shows a resend form. All API logic is in useAuth hook.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/login.styles';
import { theme } from '../constants/theme';

// The four possible states this screen can be in
type VerifyStatus = 'loading' | 'success' | 'error' | 'no_token';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { handleVerifyEmail, handleResendVerification } = useAuth();

  const [status, setStatus]             = useState<VerifyStatus>('loading');
  const [message, setMessage]           = useState('Verifying your email…');
  const [email, setEmail]               = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fade + slide in, then immediately attempt verification if token exists
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    if (!token) {
      setStatus('no_token');
    } else {
      runVerification();
    }
  }, []);

  // Runs automatically on mount — not triggered by user button press
  const runVerification = async () => {
    const result = await handleVerifyEmail(token);
    setStatus(result.success ? 'success' : 'error');
    setMessage(result.message);
  };

  // Triggered by user pressing "Resend Verification Email"
  const onPressResend = async () => {
    if (!email.trim()) return;
    setResendLoading(true);
    await handleResendVerification(email);
    setResendLoading(false);
    setResendSuccess(true); // always show success — see hook for why
  };

  return (
    <Background>
      <View style={styles.screen}>
        <SafeAreaView style={{ flex: 1 }}>
          <Navbar showBack backTo="/login" />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              <View style={styles.heroText}>
                <Text style={styles.heroGreeting}>One last step</Text>
                <Text style={styles.heroTitle}>Email{'\n'}verification</Text>
              </View>

              <View style={styles.card}>

                {/* Spinner while verification request is in flight */}
                {status === 'loading' && (
                  <View style={{ alignItems: 'center', gap: 16, paddingVertical: 12 }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.footerText}>Verifying your email…</Text>
                  </View>
                )}

                {/* Token verified successfully */}
                {status === 'success' && (
                  <>
                    <View style={styles.successBox}>
                      <Text style={styles.successText}>{message}</Text>
                    </View>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
                      <Text style={styles.btnText}>Go to Login</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Token missing or invalid — show resend form */}
                {(status === 'error' || status === 'no_token') && (
                  <>
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>
                        {status === 'no_token'
                          ? 'No verification token found. Enter your email to get a new link.'
                          : message + ' Enter your email to get a new link.'}
                      </Text>
                    </View>

                    {resendSuccess ? (
                      // Confirmation message after resend — always shown regardless of outcome
                      <View style={styles.successBox}>
                        <Text style={styles.successText}>
                          If that email is registered, a new verification link has been sent. Check your inbox.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Email</Text>
                          <InputField
                            icon="✉️"
                            placeholder="your@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            returnKeyType="done"
                            onSubmitEditing={onPressResend}
                          />
                        </View>

                        <TouchableOpacity
                          style={[styles.btn, (resendLoading || !email.trim()) && styles.btnDisabled]}
                          onPress={onPressResend}
                          disabled={resendLoading || !email.trim()}
                        >
                          {resendLoading
                            ? <ActivityIndicator color={theme.colors.white} size="small" />
                            : <Text style={styles.btnText}>Resend Verification Email</Text>
                          }
                        </TouchableOpacity>
                      </>
                    )}

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Already verified?</Text>
                      <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.footerLink}> Sign in</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Background>
  );
}
