import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import Disclaimer from '../components/disclaimer';
import { styles } from '../styles/landing.styles';
import Navbar from '../components/navbar';
import ProfilePanel from '../components/profilepanel';
import { FLASK_BASE } from '../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';


export default function LandingScreen() {
  const router = useRouter();

  // ─── State ───────────────────────────────────────────────────────────────
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [authChecked, setAuthChecked]       = useState(false);
  const [userEmail, setUserEmail]           = useState('');
  const [showProfile, setShowProfile]       = useState(false);

  // ─── Animations ──────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // ─── On mount: animations + auth check ───────────────────────────────────
  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Check if already logged in
    fetch(`${FLASK_BASE}/api/auth/check`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUserEmail(data.user?.email || '');
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleGetStarted = () => {
      setShowDisclaimer(true); // logged in → disclaimer → chat
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${FLASK_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setIsLoggedIn(false);
    setUserEmail('');
    setShowProfile(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#DDD0C4', '#C8A9A4', '#A87A74', '#6b3e38']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>

        {/* Left — hamburger + brand */}
        <Navbar />

        {/* Right — Login/Sign Up when logged out, My Profile/Sign out when logged in */}
        <View style={styles.navLinks}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity
                onPress={() => setShowProfile(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.navLink}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navSignupBtn}
                onPress={handleSignOut}
                activeOpacity={0.85}
              >
                <Text style={styles.navSignupText}>Sign out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.navLink}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navSignupBtn}
                onPress={() => router.push('/signup')}
                activeOpacity={0.85}
              >
                <Text style={styles.navSignupText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Image
            source={require('../assets/images/Amanda.jpg')}
            style={styles.avatar}
          />
          <Text style={styles.eyebrow}>Private · Always here</Text>
          <Text style={styles.heading}>Hello, I'm Amanda</Text>
          <Text style={styles.tagline}>
            Your personal AI therapist.{'\n'}I'm here to help you feel heard.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryBtnText}>✦  Talk to me!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/about')}
            >
              <Text style={styles.secondaryBtnText}>How it works →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Not a substitute for emergency services
          <Text style={styles.dot}> · </Text>
          You're in control of what you share
        </Text>
      </View>

      {/* ── Disclaimer modal ── */}
      <Disclaimer
        visible={showDisclaimer}
        onAgree={() => {
          setShowDisclaimer(false);
          router.push('/chat');
        }}
        onCancel={() => setShowDisclaimer(false)}
      />

      {/* ── Profile panel — only mounted when open ── */}
      {showProfile && (
        <ProfilePanel
          onClose={() => setShowProfile(false)}
          userEmail={userEmail}
          aiModel="gpt-5.1"
          onSignOut={handleSignOut}
        />
      )}
   </SafeAreaView>
    </LinearGradient>
  
  );
}