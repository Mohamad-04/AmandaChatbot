// Animated bar indicator displayed during voice conversations.
// Same style as the voice chat button but larger and phase-aware.
// Phases: idle | listening | thinking | speaking

import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';

export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceIndicatorProps {
  phase:     VoicePhase;
  isDark?:   boolean;
}

const BAR_WIDTH  = 4;
const BAR_HEIGHT = 32;
const BAR_GAP    = 5;
const BAR_COLOR  = '#ffffff';
const CIRCLE     = 80;

// Animation config per phase
const PHASE_CONFIG = {
  idle:      { minScale: 0.08, maxScale: 0.25, minDur: 900,  maxDur: 1400 },
  listening: { minScale: 0.15, maxScale: 1.00, minDur: 200,  maxDur: 500  },
  thinking:  { minScale: 0.10, maxScale: 0.50, minDur: 700,  maxDur: 1100 },
  speaking:  { minScale: 0.20, maxScale: 0.90, minDur: 280,  maxDur: 600  },
};

export default function VoiceIndicator({ phase, isDark = false }: VoiceIndicatorProps) {
  const b0 = useRef(new Animated.Value(0.15)).current;
  const b1 = useRef(new Animated.Value(0.40)).current;
  const b2 = useRef(new Animated.Value(0.70)).current;
  const b3 = useRef(new Animated.Value(0.40)).current;
  const b4 = useRef(new Animated.Value(0.15)).current;

  const bars = [b0, b1, b2, b3, b4];

  useEffect(() => {
    bars.forEach(b => b.stopAnimation());

    const { minScale, maxScale, minDur, maxDur } = PHASE_CONFIG[phase];

    bars.forEach((bar, i) => {
      const go = () => {
        const toHigh = minScale + Math.random() * (maxScale - minScale);
        const toLow  = minScale + Math.random() * (maxScale - minScale) * 0.4;
        const durA   = minDur + Math.random() * (maxDur - minDur);
        const durB   = minDur + Math.random() * (maxDur - minDur);
        Animated.sequence([
          Animated.timing(bar, { toValue: toHigh, duration: durA, useNativeDriver: true }),
          Animated.timing(bar, { toValue: toLow,  duration: durB, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) go(); });
      };
      setTimeout(go, i * 80);
    });
  }, [phase]);

  return (
    <View style={{
      width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2,
      backgroundColor: phase === 'listening' ? (isDark ? '#B86878' : '#C47E8A')
                     : phase === 'thinking'  ? (isDark ? '#6A4848' : '#7A5550')
                     : phase === 'speaking'  ? (isDark ? '#A87880' : '#C9A29D')
                     : (isDark ? 'rgba(201,162,157,0.25)' : 'rgba(45,30,28,0.35)'),
      shadowColor:    phase === 'listening' ? '#E8A0B0' : 'transparent',
      shadowOffset:   { width: 0, height: 0 },
      shadowOpacity:  phase === 'listening' ? 0.9 : 0,
      shadowRadius:   phase === 'listening' ? 22 : 0,
      elevation:      phase === 'listening' ? 10 : 0,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.6)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: BAR_GAP, height: BAR_HEIGHT }}>
        {bars.map((bar, i) => (
          <Animated.View
            key={i}
            style={{
              width:           BAR_WIDTH,
              height:          BAR_HEIGHT,
              borderRadius:    BAR_WIDTH / 2,
              backgroundColor: BAR_COLOR,
              transform:       [{ scaleY: bar }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
