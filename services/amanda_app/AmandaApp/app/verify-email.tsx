// Verify email screen.
// Users copy the token from their email and paste it here.
// If they didn't receive the email they can request a new one.
//
// Views:
//   'token'  — default: paste token + verify
//   'resend' — secondary: enter email + resend link

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, SafeAreaView,
  Animated, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Background from '../components/background';
import Navbar from '../components/navbar';
import InputField from '../components/input-field';
import { useAuth } from '../hooks/use-auth';
import { styles } from '../styles/login.styles';
import { theme } from '../constants/theme';
import { colors } from '../constants/tokens';

type View        = 'token' | 'resend';
type VerifyState = 'idle' | 'loading' | 'success' | 'error';
type ResendState = 'idle' | 'loading' | 'sent';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const { handleVerifyEmail, handleResendVerification } = useAuth();

  const [view,         setView]         = useState<View>('token');
  const [tokenInput,   setTokenInput]   = useState('');
  const [verifyState,  setVerifyState]  = useState<VerifyState>('idle');
  const [verifyMsg,    setVerifyMsg]    = useState('');
  const [email,        setEmail]        = useState(paramEmail ?? '');
  const [resendState,  setResendState]  = useState<ResendState>('idle');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressVerify = async () => {
    if (!tokenInput.trim()) { setVerifyState('error'); setVerifyMsg('Please enter your verification token.'); return; }
    setVerifyState('loading');
    const result = await handleVerifyEmail(tokenInput.trim());
    setVerifyState(result.success ? 'success' : 'error');
    setVerifyMsg(result.message);
  };

  const onPressResend = async () => {
    if (!email.trim()) return;
    setResendState('loading');
    await handleResendVerification(email.trim().toLowerCase());
    setResendState('sent');
    // After 3 s return to token view so the user can paste their new token
    setTimeout(() => {
      setResendState('idle');
      setView('token');
    }, 3000);
  };

  const goToResend = () => {
    setVerifyState('idle');
    setVerifyMsg('');
    setView('resend');
  };

  const goToToken = () => {
    setResendState('idle');
    setView('token');
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
                  <Text style={styles.heroGreeting}>One last step</Text>
                  <Text style={styles.heroTitle}>Email{'\n'}verification</Text>
                </View>

                <View style={styles.card}>

                  {/* ── Token verified successfully ── */}
                  {verifyState === 'success' && (
                    <>
                      <View style={styles.successBox}>
                        <Text style={styles.successText}>{verifyMsg}</Text>
                      </View>
                      <Pressable style={styles.btn} onPress={() => router.replace('/login')}>
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            <Text style={styles.btnText}>Go to Login</Text>
                          </LinearGradient>
                        )}
                      </Pressable>
                    </>
                  )}

                  {/* ── Token view ── */}
                  {verifyState !== 'success' && view === 'token' && (
                    <>
                      <Text style={styles.footerText}>
                        Check your inbox for a verification token and paste it below.
                      </Text>

                      {verifyState === 'error' && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{verifyMsg}</Text>
                        </View>
                      )}

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Verification token</Text>
                        <InputField
                          icon="🔑"
                          placeholder="Paste your token here"
                          value={tokenInput}
                          onChangeText={setTokenInput}
                          returnKeyType="done"
                          onSubmitEditing={onPressVerify}
                        />
                      </View>

                      <Pressable
                        style={[styles.btn, verifyState === 'loading' && styles.btnDisabled]}
                        onPress={onPressVerify}
                        disabled={verifyState === 'loading'}
                      >
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            {verifyState === 'loading'
                              ? <ActivityIndicator color={theme.colors.white} size="small" />
                              : <Text style={styles.btnText}>Verify token</Text>
                            }
                          </LinearGradient>
                        )}
                      </Pressable>

                      <TouchableOpacity onPress={goToResend} activeOpacity={0.7} style={{ alignItems: 'center', paddingTop: 4 }}>
                        <Text style={styles.forgotText}>Didn't get the email? Resend it</Text>
                      </TouchableOpacity>

                      <View style={styles.footer}>
                        <Text style={styles.footerText}>Already verified?</Text>
                        <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                          <Text style={styles.footerLink}> Sign in</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* ── Resend view ── */}
                  {verifyState !== 'success' && view === 'resend' && (
                    <>
                      {resendState === 'sent' ? (
                        <View style={styles.successBox}>
                          <Text style={styles.successText}>
                            If that email is registered, a new token has been sent. Taking you back…
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.footerText}>
                            Enter the email address you signed up with and we'll send you a new token.
                          </Text>

                          <View style={styles.formGroup}>
                            <Text style={styles.label}>Email address</Text>
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

                          <Pressable
                            style={[styles.btn, (resendState === 'loading' || !email.trim()) && styles.btnDisabled]}
                            onPress={onPressResend}
                            disabled={resendState === 'loading' || !email.trim()}
                          >
                            {({ pressed }) => (
                              <LinearGradient
                                colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                style={styles.btnInner}
                              >
                                {resendState === 'loading'
                                  ? <ActivityIndicator color={theme.colors.white} size="small" />
                                  : <Text style={styles.btnText}>Resend token</Text>
                                }
                              </LinearGradient>
                            )}
                          </Pressable>

                          <TouchableOpacity onPress={goToToken} activeOpacity={0.7} style={{ alignItems: 'center', paddingTop: 4 }}>
                            <Text style={styles.forgotText}>I have my token — go back</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}

                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Background>
  );
}
