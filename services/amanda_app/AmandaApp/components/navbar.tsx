/**
 * Navbar.tsx — Top navigation bar + slide-out sheet with sections and auth buttons.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  Dimensions, Modal, TouchableWithoutFeedback,
  ScrollView, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '../styles/navbar.styles';
import { SupportSheet, SheetType } from './support-sheet';

const { width } = Dimensions.get('window');

type NavbarProps = {
  showBack?:   boolean;
  backTo?:     string;
  isLoggedIn?: boolean;
  userEmail?:  string;
  onLogin?:    () => void;
  onSignup?:   () => void;
  onProfile?:  () => void;
  onSignOut?:  () => void;
  lightText?:  boolean;
};

export default function Navbar({
  showBack = false,
  backTo,
  isLoggedIn = false,
  onLogin,
  onSignup,
  onProfile,
  onSignOut,
  lightText = false,
}: NavbarProps) {
  const router     = useRouter();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const sheetAnim = useRef(new Animated.Value(-width * 0.72)).current;
  const dimAnim   = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 0,             duration: 320, useNativeDriver: true }),
      Animated.timing(dimAnim,   { toValue: 1,             duration: 320, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: -width * 0.72, duration: 280, useNativeDriver: true }),
      Animated.timing(dimAnim,   { toValue: 0,             duration: 280, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false));
  };

  const navigate = (path: string) => {
    closeMenu();
    setTimeout(() => router.push(path as any), 300);
  };

  const handleContactUs = () => {
    closeMenu();
    Linking.openURL('mailto:faisaahmed004@gmail.com?subject=Amanda%20Support');
  };

  return (
    <>
      {/* ── Top bar ── */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.7}>
            <View style={[styles.menuLine, lightText && { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.menuLine, lightText && { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.menuLine, lightText && { backgroundColor: '#FFFFFF' }]} />
          </TouchableOpacity>
          <Text style={[styles.brand, lightText && { color: '#FFFFFF' }]}>Amanda</Text>
        </View>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        {isLoggedIn && !showBack && (
          <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
            <Text style={styles.signOutBtnText}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Slide-out sheet ── */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.dimOverlay, { opacity: dimAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateX: sheetAnim }] }]}>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetBrand}>Amanda</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeMenu} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable sections */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>

            <Text style={styles.sectionLabel}>Navigation</Text>
            <TouchableOpacity style={styles.row} onPress={() => navigate('/')} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>🏠</Text>
              <Text style={styles.rowLabel}>Home</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => navigate('/about')} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>🗺️</Text>
              <Text style={styles.rowLabel}>App Tour</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Support</Text>
            <TouchableOpacity style={styles.row} onPress={handleContactUs} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>✉️</Text>
              <Text style={styles.rowLabel}>Contact us</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => { closeMenu(); setTimeout(() => setActiveSheet('feedback'), 300); }} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>💬</Text>
              <Text style={styles.rowLabel}>Share feedback</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => { closeMenu(); setTimeout(() => setActiveSheet('bug'), 300); }} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>🐛</Text>
              <Text style={styles.rowLabel}>Report a bug</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Legal</Text>
            <TouchableOpacity style={styles.row} onPress={() => navigate('/terms')} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>📄</Text>
              <Text style={styles.rowLabel}>Terms & Conditions</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => navigate('/privacy')} activeOpacity={0.7}>
              <Text style={styles.rowIcon}>🔒</Text>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>

          </ScrollView>

          {/* Auth buttons at bottom */}
          <View style={styles.authSection}>
            {isLoggedIn ? (
              <>
                <TouchableOpacity
                  style={styles.authBtnSecondary}
                  onPress={() => { closeMenu(); onProfile?.(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.authBtnSecondaryText}>👤  My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.authBtnDanger}
                  onPress={() => { closeMenu(); onSignOut?.(); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.authBtnDangerText}>→  Sign out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.authBtnSecondary}
                  onPress={() => { closeMenu(); setTimeout(() => onLogin?.(), 300); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.authBtnSecondaryText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.authBtnPrimary}
                  onPress={() => { closeMenu(); setTimeout(() => onSignup?.(), 300); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.authBtnPrimaryText}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        </Animated.View>
      </Modal>

      {/* Support bottom sheets */}
      <SupportSheet
        visible={activeSheet !== null}
        type={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
