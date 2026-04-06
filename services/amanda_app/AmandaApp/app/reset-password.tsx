// Reset password screen — shows a form, success state, or invalid-token state.
// All validation and API logic is delegated to useAuth hook.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Pressable, SafeAreaView,
  KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, ScrollView, TextInput,
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
import { PasswordRequirements } from '../components/password-requirements';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { loading, error, handleResetPassword } = useAuth();

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess]                 = useState(false);

  const confirmRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  // Fade + slide in on first render
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Shakes the card to signal a failed reset attempt
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPressReset = async () => {
    const err = await handleResetPassword(token, password, confirmPassword);
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
                  <Text style={styles.heroGreeting}>Almost there</Text>
                  <Text style={styles.heroTitle}>Set a new{'\n'}password</Text>
                </View>

                <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

                  {!token ? (
                    // No token — link is invalid or missing
                    <>
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                          Invalid or missing reset link. Please request a new one.
                        </Text>
                      </View>
                      <Pressable style={styles.btn} onPress={() => router.replace('/forgot-password')}>
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            <Text style={styles.btnText}>Request Reset Link</Text>
                          </LinearGradient>
                        )}
                      </Pressable>
                    </>

                  ) : success ? (
                    // Password was reset successfully
                    <>
                      <View style={styles.successBox}>
                        <Text style={styles.successText}>
                          Password reset successfully. You can now log in with your new password.
                        </Text>
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

                  ) : (
                    // Normal form state
                    <>
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <InputField
                          icon="🔒"
                          placeholder="At least 8 characters"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          returnKeyType="next"
                          onSubmitEditing={() => confirmRef.current?.focus()}
                        />
                        <PasswordRequirements password={password} />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <InputField
                          icon="🔒"
                          placeholder="Re-enter your new password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                          returnKeyType="done"
                          onSubmitEditing={onPressReset}
                          inputRef={confirmRef}
                        />
                      </View>

                      {error !== '' && (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      )}

                      <Pressable
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={onPressReset}
                        disabled={loading}
                      >
                        {({ pressed }) => (
                          <LinearGradient
                            colors={pressed ? [colors.btnPrimaryPressC1, colors.btnPrimaryPressC2] : [colors.btnPrimary, colors.btnPrimary]}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={styles.btnInner}
                          >
                            {loading
                              ? <ActivityIndicator color={theme.colors.white} size="small" />
                              : <Text style={styles.btnText}>Reset Password</Text>
                            }
                          </LinearGradient>
                        )}
                      </Pressable>
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
