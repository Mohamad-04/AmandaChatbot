/**
 * DisclaimerModal.js — Disclaimer Bottom Sheet
 *
 * Shown when the user taps "Talk to me!" for the first time.
 * User must scroll to the bottom and check a box before continuing.
 *
 * Design choice: soft warning tone instead of aggressive red —
 * amber/yellow feels cautionary without being intimidating,
 * which suits a mental health app where we don't want to alarm users.
 *
 * Props:
 *   - visible: boolean — show or hide the modal
 *   - onAgree: function — called when user accepts and taps Continue
 *   - onCancel: function — called when user taps Cancel
 *
 * TODO (Phase 2 — Backend):
 *   When onAgree is called, send a timestamped acceptance record
 *   to the backend: { userId, timestamp, version: 'disclaimer-v1' }
 *   This is the placeholder for legal logging.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

export default function disclaimer({ visible, onAgree, onCancel }) {
  // Whether the user has checked the acknowledgement box
  const [checked, setChecked] = useState(false);

  // Whether the user has scrolled to the bottom
  // We require this so they actually read the disclaimer
  const [hasScrolled, setHasScrolled] = useState(false);

  // Subtle shake animation for when they try to continue without checking
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ── Shake the button if they haven't checked the box ──────────────────
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Handle continue press ──────────────────────────────────────────────
  const handleContinue = () => {
    if (!checked) {
      shake(); // remind them to check the box
      return;
    }

    /**
     * TODO — Backend placeholder
     * When the backend is ready, replace this comment with:
     *
     * await api.post('/api/user/disclaimer-accepted', {
     *   timestamp: new Date().toISOString(),
     *   version: 'disclaimer-v1',
     * });
     *
     * This logs the acceptance for legal purposes.
     */
    console.log('Disclaimer accepted at:', new Date().toISOString());

    onAgree();
  };

  // ── Detect when user has scrolled to the bottom ────────────────────────
  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isAtBottom) setHasScrolled(true);
  };

  // Whether the continue button is fully active
  const canContinue = checked && hasScrolled;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Dark overlay behind the modal */}
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* ── Header ── */}
          <View style={styles.header}>
            {/*
              Amber warning icon — softer than red.
              Conveys caution without alarm.
            */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>Before you continue</Text>
            <Text style={styles.subtitle}>
              Please read this carefully
            </Text>
          </View>

          {/* ── Scrollable content ── */}
          {/*
            We require scrolling to the bottom before the checkbox
            becomes active — this is a common legal UX pattern.
          */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            indicatorStyle="black"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <Section title="Not a therapist">
              Amanda is an AI-based emotional support tool. She is{' '}
              <Bold>not a licensed therapist</Bold>, psychologist, or medical
              professional and cannot provide clinical diagnoses or treatment.
            </Section>

            <Section title="For support only">
              Conversations with Amanda are for{' '}
              <Bold>informational and emotional support only</Bold>. They do not
              constitute medical advice and should not be treated as such.
            </Section>

            <Section title="In an emergency">
              If you are in crisis, experiencing thoughts of self-harm, or require
              immediate help — please contact your{' '}
              <Bold>local emergency services</Bold> or a crisis helpline immediately.
              Amanda cannot respond to emergencies.
            </Section>

            <Section title="Your privacy">
              Your conversations may be stored to improve the service. You are in
              control of what you share. See our Privacy Policy for full details.
            </Section>

            {/* Scroll prompt — disappears once they've scrolled down */}
            {!hasScrolled && (
              <Text style={styles.scrollPrompt}>↓ Scroll to continue</Text>
            )}
          </ScrollView>

          {/* ── Acknowledgement checkbox ── */}
          <TouchableOpacity
            style={[
              styles.checkRow,
              !hasScrolled && styles.checkRowDisabled,  // greyed out until scrolled
            ]}
            onPress={() => hasScrolled && setChecked(!checked)}
            activeOpacity={hasScrolled ? 0.7 : 1}
          >
            {/* Custom checkbox box */}
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[
              styles.checkLabel,
              !hasScrolled && styles.checkLabelDisabled,
            ]}>
              I have read and understood this disclaimer
            </Text>
          </TouchableOpacity>

          {/* ── Legal links line ── */}
          <Text style={styles.legalLine}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => {/* TODO: router.push('/terms') */}}
            >
              Terms & Conditions
            </Text>
            {' '}and acknowledge our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => {/* TODO: router.push('/privacy') */}}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          {/* ── Buttons ── */}
          <Animated.View
            style={[
              styles.btnWrapper,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.continueBtn,
                canContinue ? styles.continueBtnActive : styles.continueBtnDisabled,
              ]}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>
                {canContinue ? 'I understand, continue →' : 'Read & check to continue'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

/**
 * Section — a titled paragraph block inside the disclaimer.
 * Keeps the disclaimer content clean and scannable.
 */
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

/**
 * Bold — inline bold text inside a Section.
 * Used to highlight the most important words.
 */
function Bold({ children }) {
  return <Text style={styles.bold}>{children}</Text>;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#FAF8F4',      // warm off-white — matches landing screen feel
  overlay:      'rgba(0,0,0,0.60)',
  warning:      '#D97706',      // amber — cautionary but not alarming
  warningLight: '#FEF3C7',      // light amber background for icon
  brand:        '#2D2D2D',      // near-black text
  textMuted:    '#6B6560',      // muted body text
  border:       '#E5DED5',      // soft border
  link:         '#B07D62',      // terracotta — matches landing screen accent
  btnActive:    '#2D2D2D',      // dark active button
  btnDisabled:  '#C5BDB6',      // greyed out disabled button
};

const styles = StyleSheet.create({

  // Full screen dark overlay
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Modal card
  container: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: C.bg,
    borderRadius: 24,
    overflow: 'hidden',       // clips scroll content to rounded corners
    paddingBottom: 24,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: C.border,
  },

  // Amber circle with ! — soft warning icon
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.warningLight,
    borderWidth: 2,
    borderColor: C.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '700',
    color: C.warning,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.brand,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },

  // ── Scroll area ───────────────────────────────────────────────────────────
  scroll: {
    maxHeight: 260,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionText: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: C.brand,
  },

  // Prompt to scroll down
  scrollPrompt: {
    textAlign: 'center',
    color: C.warning,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  // ── Checkbox row ──────────────────────────────────────────────────────────
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F0EBE3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  checkRowDisabled: {
    opacity: 0.4,              // greyed out until user scrolls
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.btnDisabled,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: C.btnActive,
    borderColor: C.btnActive,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: C.brand,
    lineHeight: 20,
  },
  checkLabelDisabled: {
    color: C.textMuted,
  },

  // ── Legal links line ──────────────────────────────────────────────────────
  legalLine: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    marginHorizontal: 24,
  },
  legalLink: {
    color: C.link,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnWrapper: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnActive: {
    backgroundColor: C.btnActive,
  },
  continueBtnDisabled: {
    backgroundColor: C.btnDisabled,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    marginHorizontal: 24,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelBtnText: {
    color: C.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});