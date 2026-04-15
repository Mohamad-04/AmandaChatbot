// Crisis reminder - a one-time dismissible banner shown below the crisis banner
// when a crisis signal is first detected.
//

// Dismissing closes this banner only - the support banner above stays all session.

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

interface Props {
  onDismiss: () => void;
}

export default function CrisisReminder({ onDismiss }: Props) {
  // Slides up from below — sits just above the input bar
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fades and slides back down before calling onDismiss
  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      <View style={s.topRow}>
        {/* ⓘ info icon — signals this is informational, not an error */}
        <Text style={s.icon}>ⓘ</Text>
        <Text style={s.title}>Help is available</Text>
        {/* Dismiss closes this banner only — support banner remains */}
        <TouchableOpacity onPress={handleDismiss} activeOpacity={0.7} style={s.dismissBtn}>
          <Text style={s.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.body}>
        If you're having thoughts of harming yourself or ending your life, free and confidential support is available. See the banner above to get in touch. You'll reach someone trained to listen and support you.
      </Text>

      <Text style={s.note}>Services independent of Amanda</Text>

    </Animated.View>
  );
}

const s = StyleSheet.create({
  // Subdued card with left accent border — less prominent than the top banner.
  // The banner is the authority; this is just a pointer to it.
  container: {
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: 'rgba(212,134,10,0.18)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4860A',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  // ⓘ symbol — calm and informational, not alarming
  icon: {
    fontSize: 16,
    color: '#92621A',
    fontWeight: '600',
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#5C3D0E',
  },

  dismissBtn: {
    paddingLeft: 8,
    paddingVertical: 2,
  },

  dismissText: {
    fontSize: 13,
    color: '#92621A',
    fontWeight: '600',
  },

  body: {
    fontSize: 13,
    color: '#7A4E1A',
    lineHeight: 20,
    marginBottom: 10,
  },

  bold: {
    fontWeight: '700',
    color: '#5C3D0E',
  },

  // Mirrors ChatGPT's "Services independent of ChatGPT" footer note
  note: {
    fontSize: 11,
    color: '#92621A',
    fontStyle: 'italic',
  },
});
