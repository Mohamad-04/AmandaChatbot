// Sliding settings panel that opens from within the chat sidebar.
// Shows account info, app navigation, support links, and sign out.

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { profileStyles as ps, SIDEBAR_WIDTH } from '../styles/chat-sidebar.styles';
import { SupportSheet, SheetType } from './support-sheet';

// ── Types ──────────────────────────────────────────────────────────────────

interface SectionProps {
  label:    string;
  children: React.ReactNode;
}

interface RowProps {
  icon:     string;
  label:    string;
  value?:   string;
  onPress?: () => void;
  right?:   React.ReactNode;
}

export interface ProfilePanelProps {
  onClose:         () => void;
  onCloseSidebar?: () => void;
  userEmail?:      string;
  aiModel?:        string;
  onSignOut:       () => void;
}

// ── Small layout components ────────────────────────────────────────────────

const Section = ({ label, children }: SectionProps) => (
  <View style={ps.section}>
    <Text style={ps.sectionLabel}>{label}</Text>
    {children}
  </View>
);

const Row = ({ icon, label, value, onPress, right }: RowProps) => (
  <TouchableOpacity
    style={ps.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress && !right}
  >
    <Text style={ps.rowIcon}>{icon}</Text>
    <Text style={ps.rowLabel}>{label}</Text>
    {value  ? <Text style={ps.rowValue}>{value}</Text> : null}
    {right ?? null}
    {onPress && !right ? <Text style={ps.rowChevron}>›</Text> : null}
  </TouchableOpacity>
);

// ── Main component ─────────────────────────────────────────────────────────

export default function ProfilePanel({
  onClose, onCloseSidebar, userEmail, onSignOut,
}: ProfilePanelProps) {
  const router    = useRouter();
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0, duration: 260, useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SIDEBAR_WIDTH, duration: 220, useNativeDriver: true,
    }).start(() => onClose());
  };

  const navigate = (path: string) => {
    onClose();
    onCloseSidebar?.();
    setTimeout(() => router.push(path as any), 300);
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:faisaahmed004@gmail.com?subject=Amanda%20Support');
  };

  return (
    <>
      <Animated.View style={[ps.panel, { transform: [{ translateX: slideAnim }] }]}>

        <View style={ps.header}>
          <TouchableOpacity onPress={handleClose} style={ps.backBtn} activeOpacity={0.7}>
            <Text style={ps.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={ps.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          <Section label="Account">
            <Row icon="✉️" label="Email" value={userEmail || '—'} />
          </Section>

          <Section label="App">
            <Row icon="🏠" label="Home"            onPress={() => navigate('/')} />
            <Row icon="🗺️" label="Replay App Tour" onPress={() => navigate('/about')} />
          </Section>

          <Section label="Support">
            <Row icon="✉️" label="Contact us"     onPress={handleContactUs} />
            <Row icon="💬" label="Share feedback" onPress={() => setActiveSheet('feedback')} />
            <Row icon="🐛" label="Report a bug"   onPress={() => setActiveSheet('bug')} />
          </Section>

          <Section label="Legal">
            <Row icon="📄" label="Terms & Conditions" onPress={() => navigate('/terms')} />
            <Row icon="🔒" label="Privacy Policy"     onPress={() => navigate('/privacy')} />
          </Section>

        </ScrollView>

        <View style={ps.signOutWrapper}>
          <TouchableOpacity style={ps.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
            <Text style={ps.signOutIcon}>→</Text>
            <Text style={ps.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      <SupportSheet
        visible={activeSheet !== null}
        type={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
