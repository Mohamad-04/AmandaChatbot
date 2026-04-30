// Animated wave bars shown in the input bar while voice-to-text is recording.
// Bars animate randomly when active, flatten when recording stops.

import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { chatColors as C } from '../constants/theme';

interface RecordingWaveProps {
  active: boolean;
}

export default function RecordingWave({ active }: RecordingWaveProps) {
  const bars = Array.from({ length: 20 }, () => useRef(new Animated.Value(0.2)).current);

  useEffect(() => {
    if (!active) {
      // Flatten all bars when recording stops
      bars.forEach(b =>
        Animated.timing(b, { toValue: 0.2, duration: 200, useNativeDriver: true }).start()
      );
      return;
    }

    // Animate each bar randomly to simulate live audio waveform
    bars.forEach((bar, i) => {
      const go = () =>
        Animated.sequence([
          Animated.timing(bar, { toValue: 0.1 + Math.random() * 0.9, duration: 100 + Math.random() * 200, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.1 + Math.random() * 0.3, duration: 100 + Math.random() * 200, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished && active) go(); });
      setTimeout(go, i * 30);
    });
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, height: 32, paddingHorizontal: 8 }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: C.bg3, transform: [{ scaleY: bar }] }}
        />
      ))}
    </View>
  );
}