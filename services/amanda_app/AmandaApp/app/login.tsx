import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles, C } from '../styles/login.styles';
import Navbar from '../components/navbar';


import { FLASK_BASE as API_BASE } from '../constants/api';


function InputField({
  icon, placeholder, value, onChangeText,
  secureTextEntry = false,
  keyboardType,
  returnKeyType,
  onSubmitEditing = undefined,
  inputRef = undefined
}) {  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;

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

  const showError = (msg: string) => { setError(msg); shake(); };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) { showError('Please fill in both fields'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.replace('/chat');
      } else {
        showError(data.message || 'Login failed. Please try again.');
      }
    } catch {
      showError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  
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
                <Text style={styles.heroTitle}>
                  Good to see{'\n'}you again
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
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    inputRef={passwordRef}
                  />
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {error !== '' && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={styles.btnText}>Sign in</Text>
                  }
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New here?</Text>
                  <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}>
                    <Text style={styles.footerLink}> Create an account</Text>
                  </TouchableOpacity>
                </View>

              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>



     </SafeAreaView> 
    </View>
 
  );
}