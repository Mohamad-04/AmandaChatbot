// Animated typing indicator shown while Amanda is preparing her response.
// Cycles through dot counts to create a "..." loading effect.

import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { s } from '../styles/chat.styles';

export default function TypingDots() {
  const [dot, setDot] = useState(0);

  // Advances dot count every 400ms, cycling 0 → 1 → 2 → 3 → 0
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={[s.messageRow, s.messageRowAsst]}>
      <Image source={require('../assets/images/Amanda.jpg')} style={s.avatar} />
      <View style={[s.bubble, s.bubbleAsst]}>
        <Text style={s.bubbleText}>{'• • •'.slice(0, dot * 2 + 1)}</Text>
      </View>
    </View>
  );
}
