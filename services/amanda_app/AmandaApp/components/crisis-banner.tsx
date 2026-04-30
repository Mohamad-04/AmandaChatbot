// Crisis support banner — shown persistently at the top of the chat when a
// crisis signal is detected. Stays visible for the entire session so the
// helpline number is always accessible as the conversation scrolls.
//
// UK numbers are used intentionally — the AI backend currently has US numbers
// in its protocol files. These are the correct UK equivalents.
//
// Design: warm amber tone  serious but not alarming. Avoids red which
// research shows can trigger shame and cause users to disengage.

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking, StyleSheet } from 'react-native';
import { crisisColors as C } from '../constants/tokens';

// UK crisis resources — Samaritans is the primary, Mind for broader support
const SAMARITANS_NUMBER = '116123';
const MIND_URL          = 'https://www.mind.org.uk/need-urgent-help/';

export default function CrisisBanner() {
  // Slides down from above the header on first appearance
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);

  // Opens the phone dialler with the Samaritans number pre-filled
  const handleCall = () => {
    Linking.openURL(`tel:${SAMARITANS_NUMBER}`);
  };

  // Opens Mind's urgent help page in the browser
  const handleMoreSupport = () => {
    Linking.openURL(MIND_URL);
  };

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY: slideAnim }] }]}>
      <View style={s.left}>
        <Text style={s.label}>Support available</Text>
        <Text style={s.number}>Samaritans · 116 123</Text>
        <Text style={s.availability}>Free · 24/7 · Confidential</Text>
      </View>
      <View style={s.actions}>
        {/* Opens phone dialler directly — one tap to reach help */}
        <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
          <Text style={s.callBtnText}>Call now</Text>
        </TouchableOpacity>
        {/* Secondary link to Mind for broader resources */}
        <TouchableOpacity onPress={handleMoreSupport} activeOpacity={0.7} style={s.moreBtn}>
          <Text style={s.moreBtnText}>More support →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  left: {
    flex: 1,
    gap: 1,
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  number: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textDark,
  },

  availability: {
    fontSize: 11,
    color: C.textMuted,
  },

  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },

  callBtn: {
    backgroundColor: C.btn,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },

  moreBtn: {
    paddingVertical: 2,
  },

  moreBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
});
