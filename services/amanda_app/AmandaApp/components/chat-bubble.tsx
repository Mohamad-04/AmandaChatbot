// A single chat message bubble.
// Renders differently for user vs Amanda messages.
// Shows a blinking cursor while Amanda is mid-stream.

import React from 'react';
import { View, Text, Image } from 'react-native';
import { s } from '../styles/chat.styles';
import { useThemeColors } from '../contexts/theme-context';

interface ChatBubbleProps {
  role:        'user' | 'assistant';
  content:     string;
}

const ChatBubble = React.memo(({ role, content }: ChatBubbleProps) => {
  const isUser = role === 'user';
  const tc = useThemeColors();
  return (
    <View style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowAsst]}>
      {/* Amanda's avatar only shown on her messages, not the user's */}
      {!isUser && (
        <Image source={require('../assets/images/Amanda.jpg')} style={s.avatar} />
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAsst, { backgroundColor: tc.bgGlass, borderColor: tc.borderCard }]}>
        <Text style={[s.bubbleText, { color: tc.text }]}>
          {content}
        </Text>
      </View>
    </View>
  );
});

export default ChatBubble;