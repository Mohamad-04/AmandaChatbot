// Landing screen — entry point of the app.
// Shows Amanda's intro card, handles auth state, and leads to the chat.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Disclaimer   from '../components/disclaimer';
import Navbar        from '../components/navbar';
import ProfilePanel  from '../components/profile-panel';
import { useAuth }   from '../hooks/use-auth';
import { styles }    from '../styles/landing.styles';
import { theme }     from '../constants/theme';

export default function LandingScreen() {
  const router = useRouter();
  const { handleLogout, getSessionUser } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isLoggedIn,     setIsLoggedIn]     = useState(false);
  const [userEmail,      setUserEmail]      = useState('');
  const [showProfile,    setShowProfile]    = useState(false);

  // ── Animations ─────────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // ── On mount — animate in and check session ────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    // Check if user is already logged in from a previous session
    getSessionUser().then(({ loggedIn, email }) => {
      setIsLoggedIn(loggedIn);
      setUserEmail(email);
    });
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────

  // Opens the disclaimer before entering chat — required on first visit
  const handleGetStarted = () => setShowDisclaimer(true);

  // Signs out and resets local auth state
  const handleSignOut = async () => {
    await handleLogout();
    setIsLoggedIn(false);
    setUserEmail('');
    setShowProfile(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={theme.colors.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Navbar — shows login/signup or profile/signout based on auth state */}
        <View style={styles.navbar}>
          <Navbar />
          <View style={styles.navLinks}>
            {isLoggedIn ? (
              <>
                <TouchableOpacity onPress={() => setShowProfile(true)} activeOpacity={0.7}>
                  <Text style={styles.navLink}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navSignupBtn} onPress={handleSignOut} activeOpacity={0.85}>
                  <Text style={styles.navSignupText}>Sign out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                  <Text style={styles.navLink}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navSignupBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
                  <Text style={styles.navSignupText}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Hero card — Amanda's intro and call to action */}
        <View style={styles.hero}>
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
              <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={handleGetStarted}>
                <Text style={styles.primaryBtnText}>✦  Talk to me!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8} onPress={() => router.push('/about')}>
                <Text style={styles.secondaryBtnText}>How it works →</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Footer disclaimer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Not a substitute for emergency services
            <Text style={styles.dot}> · </Text>
            You're in control of what you share
          </Text>
        </View>

        {/* Disclaimer modal — shown before entering chat */}
        <Disclaimer
          visible={showDisclaimer}
          onAgree={() => { setShowDisclaimer(false); router.push('/chat'); }}
          onCancel={() => setShowDisclaimer(false)}
        />

        {/* Profile settings panel */}
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