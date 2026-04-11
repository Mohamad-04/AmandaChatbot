// Forgot password screen.
// Users request a reset link, then paste the token from their email.
// On success, navigates to reset-password to set a new password.
//
// Views:
//   'email' — default: enter email + send reset link
//   'token' — paste token + verify

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, SafeAreaView,
  Animated, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/login.styles';
import { theme } from '../constants/theme';
import { colors } from '../constants/tokens';

type ScreenView = 'email' | 'token';
type SendState  = 'idle' | 'loading';
type TokenState = 'idle' | 'loading' | 'error';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { handleForgotPassword, handleVerifyResetToken } = useAuth();

  const [view,       setView]       = useState<ScreenView>('email');
  const [email,      setEmail]      = useState('');
  const [sendState,  setSendState]  = useState<SendState>('idle');
  const [sendError,  setSendError]  = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenState, setTokenState] = useState<TokenState>('idle');
  const [tokenError, setTokenError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPressSend = async () => {
    if (!email.trim()) { setSendError('Please enter your email address.'); shake(); return; }
    setSendState('loading');
    setSendError('');
    const err = await handleForgotPassword(email);
    setSendState('idle');
    if (err) { setSendError(err); shake(); return; }
    setView('token');
  };

  const onPressVerify = async () => {
    if (!tokenInput.trim()) { setTokenState('error'); setTokenError('Please enter your reset token.'); shake(); return; }
    setTokenState('loading');
    setTokenError('');
    const result = await handleVerifyResetToken(tokenInput.trim());
    if (result.success) {
      router.replace({ pathname: '/reset-password', params: { token: tokenInput.trim() } });
    } else {
      setTokenState('error');
      setTokenError(result.message);
      shake();
    }
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
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                <View style={styles.heroText}>
                  <Text style={styles.heroGreeting}>Account recovery</Text>
                  <Text style={styles.heroTitle}>Reset your{'\n'}password</Text>
                </View>

                <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

                  {/* ── Email view ── */}
                  {view === 'email' && (
                    <>
                      <Text style={styles.footerText}>
                        Enter the email linked to your account and we'll send you a reset link.
                      </Text>

                      {sendError !== '' && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{sendError}</Text>
                        </View>
                      )}

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Email address</Text>
                        <InputField
                          icon="✉️"
                          placeholder="your@email.com"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          returnKeyType="done"
                          onSubmitEditing={onPressSend}
                        />
                      </View>

                      <Pressable
                        style={[styles.btn, sendState === 'loading' && styles.btnDisabled]}
                        onPress={onPressSend}
                        disabled={sendState === 'loading'}
                      >
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            {sendState === 'loading'
                              ? <ActivityIndicator color={theme.colors.white} size="small" />
                              : <Text style={styles.btnText}>Send Reset Link</Text>
                            }
                          </LinearGradient>
                        )}
                      </Pressable>

                      <View style={styles.footer}>
                        <Text style={styles.footerText}>Remember your password?</Text>
                        <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
                          <Text style={styles.footerLink}> Sign in</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* ── Token view ── */}
                  {view === 'token' && (
                    <>
                      <Text style={styles.footerText}>
                        Check your inbox for a reset link. Copy the token at the end of the link and paste it below.
                      </Text>

                      {tokenState === 'error' && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{tokenError}</Text>
                        </View>
                      )}

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Reset token</Text>
                        <InputField
                          icon="🔑"
                          placeholder="Paste your token here"
                          value={tokenInput}
                          onChangeText={setTokenInput}
                          returnKeyType="done"
                          onSubmitEditing={onPressVerify}
                          textContentType="none"
                        />
                      </View>

                      <Pressable
                        style={[styles.btn, tokenState === 'loading' && styles.btnDisabled]}
                        onPress={onPressVerify}
                        disabled={tokenState === 'loading'}
                      >
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            {tokenState === 'loading'
                              ? <ActivityIndicator color={theme.colors.white} size="small" />
                              : <Text style={styles.btnText}>Verify token</Text>
                            }
                          </LinearGradient>
                        )}
                      </Pressable>

                      <TouchableOpacity onPress={() => setView('email')} activeOpacity={0.7} style={{ alignItems: 'center', paddingTop: 4 }}>
                        <Text style={styles.forgotText}>Didn't get the email? Go back</Text>
                      </TouchableOpacity>
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
