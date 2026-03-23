/**
 * Navbar.tsx — Reusable navigation bar
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles, C} from '../styles/navbar.styles';

const { width } = Dimensions.get('window');

type NavbarProps = {
  showBack?: boolean;
  backTo?: string;
};

function DropdownItem({ label, items, navigate }) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const TOTAL_HEIGHT = items.length * 44;

  const toggle = () => {
    Animated.timing(heightAnim, {
      toValue: open ? 0 : TOTAL_HEIGHT,
      duration: 220,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  return (
    <View>
      <TouchableOpacity style={styles.sheetLink} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.dropdownRow}>
          <Text style={styles.sheetLinkText}>{label}</Text>
          <Text style={styles.dropdownArrow}>{open ? '▾' : '▸'}</Text>
        </View>
      </TouchableOpacity>
      <Animated.View style={[styles.dropdownChildren, { height: heightAnim }]}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={styles.dropdownChild}
            onPress={() => navigate(item.path)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownIndent} />
            <Text style={styles.dropdownChildText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

export default function Navbar({ showBack = false, backTo = '/' }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <>
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.menuBtn} onPress={openMenu} activeOpacity={0.7}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          <Text style={styles.brand}>Amanda</Text>
        </View>
        {showBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.dimOverlay, { opacity: dimAnim }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.sheet, { transform: [{ translateX: sheetAnim }] }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetBrand}>Amanda</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={closeMenu} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetTitle}>Navigation</Text>
          <View style={styles.sheetLinks}>
            <TouchableOpacity style={styles.sheetLink} onPress={() => navigate('/')}>
              <Text style={styles.sheetLinkText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetLink} onPress={() => navigate('/about')}>
              <Text style={styles.sheetLinkText}>App Tour</Text>
            </TouchableOpacity>
            <DropdownItem
              label="Support"
              items={[
                { label: 'Contact us',     path: '/contact' },
                { label: 'Share feedback', path: '/feedback' },
                { label: 'Report a bug',   path: '/bugreport' },
              ]}
              navigate={navigate}
            />
            <DropdownItem
              label="Legal"
              items={[
                { label: 'Terms & Conditions', path: '/terms' },
                { label: 'Privacy Policy',     path: '/privacy' },
              ]}
              navigate={navigate}
            />
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}