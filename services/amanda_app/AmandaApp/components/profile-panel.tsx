// ProfilePanel — slides in over the chat sidebar when the profile footer is tapped.
// Contains a multi-level settings layout: tapping a row slides in a sub-page
// within the same panel (no new screen is pushed to the navigation stack).
//
// Profile data (first name, last name, age range) is stored in AsyncStorage
// as a placeholder until the backend user-profile endpoints are ready.
// When backend is ready: swap the AsyncStorage calls in saveProfile() for an API call.

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ScrollView, TextInput, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { profileStyles as ps, C, SIDEBAR_WIDTH } from '../styles/chat-sidebar.styles';
import { SupportSheet, SheetType } from './support-sheet';

// ── Constants ──────────────────────────────────────────────────────────────────

// Local storage key for profile data (placeholder until backend is ready)
const PROFILE_KEY = '@amanda_profile';

const AGE_RANGES = ['<18', '18–24', '25–34', '35–44', '45+'];

// Sub-pages that slide in over the main settings list
type SubPage =
  | 'edit-profile'
  | 'data-privacy'
  | 'mood-tracking'
  | 'insights'
  | 'weekly-checkin';

interface Profile {
  firstName: string;
  lastName:  string;
  ageRange:  string;
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface ProfilePanelProps {
  onClose:         () => void;
  onCloseSidebar?: () => void;
  userEmail?:      string;
  aiModel?:        string;
  onSignOut:       () => void;
}

// ── Reusable layout components ─────────────────────────────────────────────────

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={ps.section}>
    <Text style={ps.sectionLabel}>{label}</Text>
    <View style={ps.sectionCard}>{children}</View>
  </View>
);

const Row = ({
  icon, label, value, onPress, danger, last,
}: {
  icon: string; label: string; value?: string;
  onPress?: () => void; danger?: boolean; last?: boolean;
}) => (
  <TouchableOpacity
    style={[ps.row, last && ps.rowLast]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    <Text style={[ps.rowIcon, danger && ps.rowIconDanger]}>{icon}</Text>
    <Text style={[ps.rowLabel, danger && ps.rowLabelDanger]}>{label}</Text>
    {value ? <Text style={ps.rowValue}>{value}</Text> : null}
    {onPress ? <Text style={[ps.rowChevron, danger && ps.rowChevronDanger]}>›</Text> : null}
  </TouchableOpacity>
);

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfilePanel({
  onClose, onCloseSidebar, userEmail, onSignOut,
}: ProfilePanelProps) {
  const router       = useRouter();
  const panelAnim    = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const subAnim      = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;

  const [subPage,          setSubPage]          = useState<SubPage | null>(null);
  const [activeSheet,      setActiveSheet]      = useState<SheetType>(null);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [showAgePicker,    setShowAgePicker]    = useState(false);

  // Edit profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [ageRange,  setAgeRange]  = useState('');

  // Load saved profile from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then(val => {
      if (val) {
        const p = JSON.parse(val) as Profile;
        setFirstName(p.firstName || '');
        setLastName(p.lastName  || '');
        setAgeRange(p.ageRange  || '');
      }
    }).catch(() => {});
  }, []);

  // Slide the main panel in on mount
  useEffect(() => {
    Animated.timing(panelAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const handleClose = () => {
    Animated.timing(panelAnim, { toValue: SIDEBAR_WIDTH, duration: 220, useNativeDriver: true })
      .start(() => onClose());
  };

  // Open a sub-page by sliding it in from the right
  const openSubPage = (page: SubPage) => {
    setSubPage(page);
    subAnim.setValue(SIDEBAR_WIDTH);
    Animated.timing(subAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  };

  // Slide the sub-page back out to reveal the main list
  const closeSubPage = () => {
    Animated.timing(subAnim, { toValue: SIDEBAR_WIDTH, duration: 220, useNativeDriver: true })
      .start(() => setSubPage(null));
  };

  // Navigate to a new app screen (closes both panel and sidebar first)
  const navigate = (path: string) => {
    handleClose();
    onCloseSidebar?.();
    setTimeout(() => router.push(path as any), 300);
  };

  // ── Profile save (AsyncStorage placeholder) ────────────────────────────────

  const saveProfile = async () => {
    // TODO: replace AsyncStorage call with PATCH /api/users/profile when backend is ready
    await AsyncStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ firstName, lastName, ageRange }),
    ).catch(() => {});
    closeSubPage();
  };

  // ── Sub-page title map ─────────────────────────────────────────────────────

  const subPageTitle: Record<SubPage, string> = {
    'edit-profile':   'Edit Profile',
    'data-privacy':   'Data & Privacy',
    'mood-tracking':  'Mood Tracking',
    'insights':       'Insights',
    'weekly-checkin': 'Weekly Check-in',
  };

  // ── Sub-page content renderers ─────────────────────────────────────────────

  const renderEditProfile = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={ps.formScroll} keyboardShouldPersistTaps="handled">

      <View style={ps.formGroup}>
        <Text style={ps.formLabel}>First Name <Text style={ps.required}>*</Text></Text>
        <TextInput
          style={ps.formInput}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Your first name"
          placeholderTextColor={C.textLight}
          autoCapitalize="words"
          textContentType="givenName"
        />
      </View>

      <View style={ps.formGroup}>
        <Text style={ps.formLabel}>Last Name <Text style={ps.optional}>(optional)</Text></Text>
        <TextInput
          style={ps.formInput}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Your last name"
          placeholderTextColor={C.textLight}
          autoCapitalize="words"
          textContentType="familyName"
        />
      </View>

      <View style={ps.formGroup}>
        <Text style={ps.formLabel}>Age Range <Text style={ps.optional}>(optional)</Text></Text>
        {/* Custom dropdown — opens a modal picker styled to match the app */}
        <TouchableOpacity style={ps.pickerBtn} onPress={() => setShowAgePicker(true)} activeOpacity={0.7}>
          <Text style={[ps.pickerBtnText, !ageRange && ps.pickerBtnPlaceholder]}>
            {ageRange || 'Select age range'}
          </Text>
          <Text style={ps.pickerChevron}>⌄</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[ps.saveBtn, !firstName.trim() && ps.saveBtnDisabled]}
        onPress={saveProfile}
        disabled={!firstName.trim()}
        activeOpacity={0.85}
      >
        <Text style={ps.saveBtnText}>Save</Text>
      </TouchableOpacity>

    </ScrollView>
  );

  const renderDataPrivacy = () => (
    <View style={ps.subPageBody}>
      <Section label="Account">
        <Row
          icon="🗑️"
          label="Delete Account"
          onPress={() => setShowDeleteModal(true)}
          danger
          last
        />
      </Section>
    </View>
  );

  // Placeholder for My Journey sub-pages — replaced with real content later
  const renderComingSoon = () => (
    <View style={ps.comingSoonContainer}>
      <Text style={ps.comingSoonEmoji}>🌱</Text>
      <Text style={ps.comingSoonTitle}>Coming soon</Text>
      <Text style={ps.comingSoonSub}>This feature is on its way.</Text>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <Animated.View style={[ps.panel, { transform: [{ translateX: panelAnim }] }]}>

        {/* Main header */}
        <View style={ps.header}>
          <TouchableOpacity onPress={handleClose} style={ps.backBtn} activeOpacity={0.7}>
            <Text style={ps.backBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={ps.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView indicatorStyle="black" contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── Account ─────────────────────────────────────────────────── */}
          <Section label="Account">
            <Row icon="✉️" label="Email"           value={userEmail || '—'} last={false} />
            <Row icon="👤" label="Edit Profile"    onPress={() => openSubPage('edit-profile')} last={false} />
            <Row icon="🔒" label="Data & Privacy"  onPress={() => openSubPage('data-privacy')} last />
          </Section>

          {/* ── My Journey (placeholder — each leads to "coming soon") ───── */}
          <Section label="My Journey">
            <Row icon="😊" label="Mood Tracking"   onPress={() => openSubPage('mood-tracking')} last={false} />
            <Row icon="📊" label="Insights"         onPress={() => openSubPage('insights')} last={false} />
            <Row icon="📝" label="Weekly Check-in"  onPress={() => openSubPage('weekly-checkin')} last />
          </Section>

          {/* ── App ─────────────────────────────────────────────────────── */}
          <Section label="App">
            <Row icon="🏠" label="Home"            onPress={() => navigate('/')} last={false} />
            <Row icon="🗺️" label="Replay App Tour" onPress={() => navigate('/about')} last />
          </Section>

          {/* ── Support ─────────────────────────────────────────────────── */}
          <Section label="Support">
            <Row icon="✉️" label="Contact us"     onPress={() => Linking.openURL('mailto:faisaahmed004@gmail.com?subject=Amanda%20Support')} last={false} />
            <Row icon="💬" label="Share feedback" onPress={() => setActiveSheet('feedback')} last={false} />
            <Row icon="🐛" label="Report a bug"   onPress={() => setActiveSheet('bug')} last />
          </Section>

          {/* ── Legal ───────────────────────────────────────────────────── */}
          <Section label="Legal">
            <Row icon="📄" label="Terms & Conditions" onPress={() => navigate('/terms')} last={false} />
            <Row icon="🔒" label="Privacy Policy"     onPress={() => navigate('/privacy')} last />
          </Section>

        </ScrollView>

        {/* Sign out — pinned to bottom */}
        <View style={ps.signOutWrapper}>
          <TouchableOpacity style={ps.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
            <Text style={ps.signOutIcon}>→</Text>
            <Text style={ps.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sub-page overlay — slides in over the main list ─────────── */}
        {subPage && (
          <Animated.View style={[ps.subPage, { transform: [{ translateX: subAnim }] }]}>
            <View style={ps.header}>
              <TouchableOpacity onPress={closeSubPage} style={ps.backBtn} activeOpacity={0.7}>
                <Text style={ps.backBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={ps.headerTitle}>{subPageTitle[subPage]}</Text>
              <TouchableOpacity onPress={handleClose} style={ps.closeBtn} activeOpacity={0.7}>
                <Text style={ps.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {subPage === 'edit-profile'   && renderEditProfile()}
            {subPage === 'data-privacy'   && renderDataPrivacy()}
            {(subPage === 'mood-tracking' ||
              subPage === 'insights'      ||
              subPage === 'weekly-checkin') && renderComingSoon()}
          </Animated.View>
        )}

      </Animated.View>

      {/* ── Age range picker modal ───────────────────────────────────────── */}
      <Modal visible={showAgePicker} transparent animationType="fade" onRequestClose={() => setShowAgePicker(false)}>
        <TouchableOpacity style={ps.modalBackdrop} activeOpacity={1} onPress={() => setShowAgePicker(false)}>
          <View style={ps.pickerModal}>
            <Text style={ps.pickerModalTitle}>Select Age Range</Text>
            {AGE_RANGES.map(range => (
              <TouchableOpacity
                key={range}
                style={[ps.pickerOption, ageRange === range && ps.pickerOptionActive]}
                onPress={() => { setAgeRange(range); setShowAgePicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={[ps.pickerOptionText, ageRange === range && ps.pickerOptionTextActive]}>
                  {range}
                </Text>
                {ageRange === range && <Text style={ps.pickerTick}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete account confirmation modal ───────────────────────────── */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <TouchableOpacity style={ps.modalBackdrop} activeOpacity={1} onPress={() => setShowDeleteModal(false)}>
          <TouchableOpacity style={ps.deleteModal} activeOpacity={1}>
            <Text style={ps.deleteModalEmoji}>⚠️</Text>
            <Text style={ps.deleteModalTitle}>Delete Account?</Text>
            <Text style={ps.deleteModalSub}>
              All your chats, profile data, and history will be permanently removed. This cannot be undone.
            </Text>
            <TouchableOpacity
              style={ps.deleteModalComingSoon}
              activeOpacity={0.8}
            >
              {/* TODO: wire up account deletion API when backend endpoint is ready */}
              <Text style={ps.deleteModalComingSoonText}>Coming soon</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ps.deleteModalCancel} onPress={() => setShowDeleteModal(false)} activeOpacity={0.7}>
              <Text style={ps.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Support sheets (feedback / bug report) ──────────────────────── */}
      <SupportSheet
        visible={activeSheet !== null}
        type={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
