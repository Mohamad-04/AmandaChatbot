// Reusable bottom sheet for Support actions — used in both navbar and profile panel.
// Covers: Share Feedback (star rating + text) and Report a Bug (text only).

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Modal,
  TextInput, Linking, Platform, KeyboardAvoidingView,
} from 'react-native';
import { supportSheetStyles as bs } from '../styles/chat-sidebar.styles';

export type SheetType = 'feedback' | 'bug' | null;

// ── Star rating ────────────────────────────────────────────────────────────

export function StarRating({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <View style={bs.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} activeOpacity={0.7}>
          <Text style={[bs.star, n <= rating && bs.starFilled]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Bottom sheet ───────────────────────────────────────────────────────────

interface SupportSheetProps {
  visible: boolean;
  onClose: () => void;
  type:    SheetType;
}

export function SupportSheet({ visible, onClose, type }: SupportSheetProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [text,   setText]   = useState('');
  const [rating, setRating] = useState(0);
  const [done,   setDone]   = useState(false);

  useEffect(() => {
    if (visible) {
      setText('');
      setRating(0);
      setDone(false);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSubmit = () => setDone(true);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400, duration: 220, useNativeDriver: true,
    }).start(() => onClose());
  };

  const isFeedback = type === 'feedback';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableOpacity style={bs.backdrop} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : 'height'} style={bs.kvWrapper}>
        <Animated.View style={[bs.sheet, { transform: [{ translateY: slideAnim }] }]}>

          <TouchableOpacity style={bs.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={bs.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {done ? (
            <View style={bs.confirmBox}>
              <Text style={bs.confirmEmoji}>{isFeedback ? '🎉' : '✅'}</Text>
              <Text style={bs.confirmTitle}>
                {isFeedback ? 'Thanks for your feedback!' : 'Report submitted!'}
              </Text>
              <Text style={bs.confirmSub}>
                {isFeedback
                  ? 'We really appreciate you taking the time to share your thoughts.'
                  : "We'll look into this as soon as possible."}
              </Text>
            </View>
          ) : (
            <>
              <Text style={bs.title}>
                {isFeedback ? 'Share Feedback 📣' : 'Report a Bug 🐛'}
              </Text>
              <Text style={bs.subtitle}>
                {isFeedback
                  ? 'Tell us what you think about Amanda and how we can make it better.'
                  : "Describe what went wrong and we'll get it fixed."}
              </Text>

              {isFeedback && <StarRating rating={rating} onRate={setRating} />}

              <TextInput
                style={bs.textArea}
                value={text}
                onChangeText={setText}
                placeholder={isFeedback
                  ? 'Tell us how we can make Amanda better…'
                  : 'Describe the bug you encountered…'}
                placeholderTextColor="#a89290"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={bs.actions}>
                <TouchableOpacity style={bs.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
                  <Text style={bs.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[bs.submitBtn, (!text.trim() && (rating === 0 || !isFeedback)) && bs.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!text.trim() && rating === 0 && isFeedback || !text.trim() && !isFeedback}
                  activeOpacity={0.85}
                >
                  <Text style={bs.submitBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
