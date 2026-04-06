// Animated indicator displayed during voice conversations.
// Pulses and changes colour based on what Amanda is currently doing.
// Phases: idle | listening | thinking | speaking

import React, { useRef, useEffect } from 'react';
import { View, Image, Animated } from 'react-native';
import { chatColors as C } from '../constants/theme';

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceIndicatorProps {
  phase: VoicePhase;
}

export default function VoiceIndicator({ phase }: VoiceIndicatorProps) {
  const p1 = useRef(new Animated.Value(1)).current;
  const p2 = useRef(new Animated.Value(1)).current;
  const p3 = useRef(new Animated.Value(1)).current;
  const op = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    p1.stopAnimation();
    p2.stopAnimation();
    p3.stopAnimation();

    if (phase === 'idle') {
      Animated.timing(op, { toValue: 0.4, duration: 300, useNativeDriver: true }).start();
      [p1, p2, p3].forEach(p =>
        Animated.spring(p, { toValue: 1, useNativeDriver: true }).start()
      );
      return;
    }

    Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    const dur    = phase === 'listening' ? 700 : phase === 'speaking' ? 500 : 1100;
    const scales = phase === 'listening' ? [1.18, 1.34, 1.50] : [1.08, 1.16, 1.26];

    [p1, p2, p3].forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(anim, { toValue: scales[i], duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,         duration: dur, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [phase]);

  // Ring colour changes to reflect what Amanda is currently doing
  const color = phase === 'listening' ? '#E8593C'
              : phase === 'thinking'  ? C.textMuted
              : phase === 'speaking'  ? '#4A90D9'
              : C.bg3;

  const SIZE = 72;

  return (
    <View style={{ width: SIZE * 2.6, height: SIZE * 2.6, alignItems: 'center', justifyContent: 'center' }}>
      {[p3, p2, p1].map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width:           SIZE * [2.4, 1.8, 1.35][i],
            height:          SIZE * [2.4, 1.8, 1.35][i],
            borderRadius:    SIZE * [1.2, 0.9, 0.675][i],
            backgroundColor: `rgba(168,122,116,${[0.07, 0.13, 0.22][i]})`,
            transform: [{ scale: p }],
            opacity: op,
          }}
        />
      ))}

      {/* Amanda's photo sits in the centre — the coloured ring around it shows her current phase */}
      <View style={{
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        backgroundColor: color, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Image
          source={require('../assets/images/Amanda.jpg')}
          style={{ width: SIZE, height: SIZE }}
        />
      </View>
    </View>
  );
}
