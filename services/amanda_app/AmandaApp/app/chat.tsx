// Main chat screen — text messaging with Socket.IO streaming, voice-to-text
// input (mic icon), and inline voice conversation mode (replaces input bar).
// Voice transcripts are saved to chat history identically to text messages.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, SafeAreaView, Modal, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import ChatSidebar    from '../components/chat-sidebar';
import LoginModal     from '../components/login-modal';
import ChatBubble     from '../components/chat-bubble';
import TypingDots     from '../components/typing-dots';
import RecordingWave  from '../components/recording-wave';
import VoiceIndicator from '../components/voice-indicator';
import CrisisBanner   from '../components/crisis-banner';
import CrisisReminder from '../components/crisis-reminder';
import { useChat }         from '../hooks/use-chat';
import { useVoiceChat }    from '../hooks/use-voice-chat';
import { useTranscription } from '../hooks/use-transcription';
import { s }              from '../styles/chat.styles';
import { chatColors as C } from '../constants/theme';
import { useThemeContext, useThemeColors } from '../contexts/theme-context';


// Animated wave bars on the voice chat button — only used here
function VoiceChatIcon() {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.8)).current,
    useRef(new Animated.Value(0.5)).current,
  ];

  useEffect(() => {
    bars.forEach((bar, i) => {
      const go = () =>
        Animated.sequence([
          Animated.timing(bar, { toValue: 0.2 + Math.random() * 0.8, duration: 400 + Math.random() * 400, useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.2 + Math.random() * 0.4, duration: 400 + Math.random() * 400, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) go(); });
      setTimeout(go, i * 120);
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: '#fff', transform: [{ scaleY: bar }] }}
        />
      ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ onChip, tc, isDark }: any) => (
  <View style={s.emptyState}>
    <Text style={[s.emptyTitle, { color: tc.text }]}>Hi, I'm Amanda</Text>
    <Text style={[s.emptySubtitle, { color: tc.textMuted }]}>I'm here to listen. What's on your mind?</Text>
    <View style={s.chips}>
      {["How are you feeling today?", "I need someone to talk to", "Help me manage my stress", "I've been feeling anxious"].map(c => (
        <TouchableOpacity key={c} style={[s.chip, isDark && { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }]} onPress={() => onChip(c)} activeOpacity={0.7}>
          <Text style={[s.chipText, { color: tc.textMuted }]}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);


// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router = useRouter();
  const { chatId: routeChatId } = useLocalSearchParams();

  // ── Hooks — all logic lives here, screen just displays ────────────────
  const {
    messages,
    setMessages,
    currentChatId,
    chatTitle,
    isStreaming,
    streamingText,
    inputText,
    setInputText,
    isReady,
    isLoading,
    isAnonymous,
    userEmail,
    currentChatIdRef,
    flatListRef,
    sendMessage,
    loadChat,
    handleRename,
    handleNewChat,
  } = useChat();

  // ── Crisis detection state ─────────────────────────────────────────────
  // Defined before useVoiceChat so checkForCrisis can be passed as a callback

  // Once true, stays true for the entire session — banner never hides
  const [crisisDetected,     setCrisisDetected]     = useState(false);
  // Tracks which chat ID triggered the crisis — reminder only shows in that chat
  const [crisisChatId,       setCrisisChatId]       = useState<number | null>(null);
  // Reminder shown once on first detection — user can dismiss it
  const [showCrisisReminder, setShowCrisisReminder] = useState(false);

  // Placeholder: frontend keyword scan until backend emits a 'crisis_detected' socket event.
  // Scans the USER's message only — not Amanda's response — to avoid false positives
  // from Amanda reflecting language back empathetically.
  // Keep this list short and high-confidence (low false positive rate).
  const CRISIS_KEYWORDS = [
    'want to die', 'kill myself', 'end my life', "don't want to be here",
    'suicide', 'suicidal', 'take my own life', "can't go on", 'no reason to live',
    'better off without me', 'want it to end',
  ];

  // Checks a user message for crisis signals and sets the banner/reminder if found
  const checkForCrisis = (userMessage: string) => {
    if (crisisDetected) return; // already flagged — no need to re-check
    const lower = userMessage.toLowerCase();
    const found = CRISIS_KEYWORDS.some(kw => lower.includes(kw));
    if (found) {
      setCrisisDetected(true);
      setCrisisChatId(currentChatIdRef.current);
      setShowCrisisReminder(true);
    }
  };

  const {
    voiceMode,
    voicePhase,
    voiceStatus,
    enterVoiceMode,
    exitVoiceMode,
    handleIndicatorTap,
  } = useVoiceChat({ currentChatIdRef, flatListRef, setMessages, userEmail, onUserMessage: checkForCrisis });

  const {
    isActive:       transcriptionActive,
    isRecording:    transcriptionRecording,
    isTranscribing: transcriptionWorking,
    startRecording,
    cancelRecording,
    confirmRecording,
  } = useTranscription();

  const { isDark } = useThemeContext();
  const tc = useThemeColors();

  // ── UI state — only things that affect display, nothing else ──────────
  const [showLoginModal,     setShowLoginModal]     = useState(false);
  const [showSidebar,        setShowSidebar]        = useState(false);
  const [showChatMenu,       setShowChatMenu]       = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameText,         setRenameText]         = useState('');

  // Show login modal immediately if user is anonymous
  useEffect(() => {
    if (isAnonymous) setShowLoginModal(true);
  }, [isAnonymous]);

  // Enter voice mode automatically once the connection is ready
  useEffect(() => {
    if (isReady && !isAnonymous) enterVoiceMode();
  }, [isReady]);

  // Re-enter voice mode after switching to a different chat
  const handleSelectChat = async (chatId: number, title?: string) => {
    exitVoiceMode();
    await loadChat(chatId, title);
    enterVoiceMode();
  };

  // Re-enter voice mode after creating a new chat
  const handleNewChatWithVoice = async () => {
    exitVoiceMode();
    await handleNewChat();
    enterVoiceMode();
  };

  // Scan each user message for crisis signals before it's sent
  const sendMessageWithCrisisCheck = (text: string) => {
    checkForCrisis(text);
    sendMessage(text);
  };

  // Scroll to bottom whenever messages or streaming text updates
  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, streamingText]);

  // ── Render helpers — UI decisions only ────────────────────────────────

  // Indicator is disabled while Amanda is thinking or speaking
  const indicatorDisabled = voicePhase === 'thinking' || voicePhase === 'speaking';

  // Renders a single message bubble in the list
  const renderItem = useCallback(
    ({ item }: { item: { role: 'user' | 'assistant'; content: string } }) => (
      <ChatBubble role={item.role} content={item.content} />
    ), []
  );

  // Renders the streaming bubble or typing dots at the bottom of the list
  const listFooter = () => {
    if (!isStreaming) return null;
    if (!streamingText) return <TypingDots />;
    return <ChatBubble role="assistant" content={streamingText} />;
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) return (
    <View style={[s.loadingContainer, { backgroundColor: isDark ? '#3d2924' : tc.bgBase }]}>
      <ActivityIndicator size="large" color={tc.primary} />
      <Text style={[s.loadingText, { color: tc.textMuted }]}>Connecting to Amanda…</Text>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Gradient background — light mirrors website, dark uses same palette in deep tones */}
      <LinearGradient
        colors={isDark
          ? ['#7A4E52',  '#52322b', '#2c1e1aec']
          : ['#EAD9C8', '#C8A9A4', '#8C5652']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.85, y: 0.95 }}
        style={s.bgLayer}
        pointerEvents="none"
      />

      {/* Login prompt for anonymous users */}
      <LoginModal
        visible={showLoginModal}
        onLogin={() => {
          setShowLoginModal(false);
          router.push('/login?from=chat' as any);
        }}
        onSignup={() => {
          setShowLoginModal(false);
          router.push('/signup?from=chat' as any);
        }}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Sidebar — only shown to logged in users */}
      {!isAnonymous && (
        <ChatSidebar
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChatWithVoice}
          userEmail={userEmail}
          aiModel="GPT-5.1"
        />
      )}

      {/* Chat options menu — rename and delete */}
      <Modal
        visible={showChatMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChatMenu(false)}
      >
        <TouchableOpacity
          style={s.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowChatMenu(false)}
        >
          <View style={s.menuCard}>
            <Text style={s.menuHeading} numberOfLines={1}>{chatTitle}</Text>

            <TouchableOpacity
              style={s.menuRow}
              activeOpacity={0.7}
              onPress={() => {
                setShowChatMenu(false);
                setRenameText(chatTitle);
                setRenameModalVisible(true);
              }}
            >
              <Text style={s.menuRowIcon}>✏️</Text>
              <Text style={s.menuRowText}>Rename</Text>
            </TouchableOpacity>

            <View style={s.menuSeparator} />

          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <TouchableOpacity
          style={s.menuOverlay}
          activeOpacity={1}
          onPress={() => setRenameModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.renameCard}>
            <Text style={s.renameTitle}>Rename chat</Text>
            <TextInput
              style={s.renameInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Chat name…"
              placeholderTextColor={C.textLight}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={async () => {
                const success = await handleRename(renameText);
                if (success) setRenameModalVisible(false);
              }}
            />
            <View style={s.renameActions}>
              <TouchableOpacity
                style={s.renameBtnCancel}
                onPress={() => setRenameModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={s.renameBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.renameBtnSave}
                activeOpacity={0.85}
                onPress={async () => {
                  const success = await handleRename(renameText);
                  if (success) setRenameModalVisible(false);
                }}
              >
                <Text style={s.renameBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header — shows "· Voice" suffix in voice mode */}
        <View style={[s.header, { backgroundColor: isDark ? 'rgba(122,78,82,0.35)' : 'rgba(241,227,211,0.35)', borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : tc.border }]}>
          {!isAnonymous ? (
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <View style={[s.hLine, { backgroundColor: tc.text }]} />
              <View style={[s.hLine, { width: 14, backgroundColor: tc.text }]} />
              <View style={[s.hLine, { backgroundColor: tc.text }]} />
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}

          <TouchableOpacity
            onPress={() => !isAnonymous && !voiceMode && setShowChatMenu(true)}
            activeOpacity={isAnonymous || voiceMode ? 1 : 0.7}
            style={s.headerTitleBtn}
          >
            <Text style={[s.headerTitle, { color: tc.text }]} numberOfLines={1}>
              {chatTitle}{voiceMode ? ' · Voice' : ''}
            </Text>
            {!isAnonymous && !voiceMode && (
              <Text style={[s.headerTitleChevron, { color: tc.textMuted }]}>⌄</Text>
            )}
          </TouchableOpacity>

          {isAnonymous ? (
            <TouchableOpacity
              style={[s.headerSignInBtn, isDark && { backgroundColor: 'rgba(221,208,196,0.15)', borderColor: 'rgba(221,208,196,0.25)' }]}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[s.headerSignInText, { color: tc.text }]}>Sign in</Text>
            </TouchableOpacity>
          ) : voiceMode ? (
            <TouchableOpacity
              style={[s.headerSignInBtn, isDark && { backgroundColor: 'rgba(221,208,196,0.15)', borderColor: 'rgba(221,208,196,0.25)' }]}
              onPress={exitVoiceMode}
              activeOpacity={0.7}
            >
              <Text style={[s.headerSignInText, { color: tc.text }]}>⌨️ Type</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}
        </View>

        {/* Crisis support banner — persistent for the entire session once triggered */}
        {crisisDetected && <CrisisBanner />}

        {/* Anonymous banner — tapping opens login modal */}
        {isAnonymous && (
          <TouchableOpacity
            style={s.anonBanner}
            onPress={() => setShowLoginModal(true)}
            activeOpacity={0.8}
          >
            <Text style={s.anonBannerText}>
              💬 Amanda is ready to talk - are you? {' '}
              <Text style={s.anonBannerLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Message list — voice transcripts appear here too */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState onChip={sendMessageWithCrisisCheck} tc={tc} isDark={isDark} />}
          ListFooterComponent={listFooter}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Crisis reminder — slides up above the input bar on first detection.
            Only shown in the chat where the crisis was detected, not when switching chats. */}
        {crisisDetected && showCrisisReminder && currentChatId === crisisChatId && (
          <CrisisReminder onDismiss={() => setShowCrisisReminder(false)} />
        )}

        {/* Bottom bar — switches between voice mode and text mode */}
        {voiceMode ? (

          // ── Voice conversation mode ──────────────────────────────────
          <View style={s.voiceBar}>
            <Text style={[s.voiceStatus, { color: tc.text }]}>{voiceStatus}</Text>

            {/* Indicator — disabled while Amanda is thinking or speaking */}
            <TouchableOpacity
              onPress={handleIndicatorTap}
              disabled={indicatorDisabled}
              activeOpacity={indicatorDisabled ? 1 : 0.85}
              style={{ opacity: indicatorDisabled ? 0.6 : 1 }}
            >
              <VoiceIndicator phase={voicePhase} />
            </TouchableOpacity>

            <Text style={[s.voiceHint, { color: tc.textMuted }]}>
              {voicePhase === 'listening' ? 'Tap to send early · speak as long as you like' :
               voicePhase === 'thinking'  ? 'Amanda is thinking — please wait' :
               voicePhase === 'speaking'  ? 'Amanda is speaking — please wait' :
                                            'Tap the indicator to start speaking'}
            </Text>

            <TouchableOpacity
              style={s.voiceCancelBtn}
              onPress={exitVoiceMode}
              activeOpacity={0.7}
            >
              <Text style={s.voiceCancelText}>Cancel voice</Text>
            </TouchableOpacity>
          </View>

        ) : (

          // ── Text input mode ──────────────────────────────────────────
          <View style={s.inputArea}>
            {transcriptionActive ? (

              // Transcription bar — shown while mic is active
              <View style={s.vttBar}>
                <TouchableOpacity
                  style={s.vttBtn}
                  onPress={cancelRecording}
                  activeOpacity={0.7}
                >
                  <Text style={s.vttX}>✕</Text>
                </TouchableOpacity>

                {transcriptionWorking ? (
                  <View style={s.vttMiddle}>
                    <ActivityIndicator color={C.bg3} size="small" />
                    <Text style={s.vttTranscribingText}>Transcribing...</Text>
                  </View>
                ) : (
                  <RecordingWave active={transcriptionRecording} />
                )}

                <TouchableOpacity
                  style={[s.vttBtn, s.vttConfirm]}
                  onPress={() => confirmRecording((text) => setInputText(text))}
                  disabled={transcriptionWorking}
                  activeOpacity={0.7}
                >
                  <Text style={s.vttTick}>✓</Text>
                </TouchableOpacity>
              </View>

            ) : (

              // Normal text input — pill layout: mic | text | send/wave
              <View style={[s.inputPill, { backgroundColor: tc.inputBg }, inputText.length > 0 && { backgroundColor: isDark ? 'rgba(122,78,82,0.50)' : 'rgba(241,227,211,0.72)' }]}>

                {/* Mic button — left side */}
                <TouchableOpacity
                  style={s.pillMicBtn}
                  onPress={startRecording}
                  activeOpacity={0.7}
                >
                  <Feather name="mic" size={18} color={tc.textMuted} />
                </TouchableOpacity>

                <TextInput
                  style={[s.pillInput, { color: tc.text }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message Amanda..."
                  placeholderTextColor={tc.textLight}
                  multiline
                  maxLength={2000}
                  editable={!isStreaming && isReady}
                  onSubmitEditing={() => sendMessageWithCrisisCheck(inputText)}
                  blurOnSubmit={false}
                />

                {inputText.trim().length > 0 ? (
                  // Send button — shown when there is text to send
                  <TouchableOpacity
                    style={[s.pillSendBtn, (isStreaming || !isReady) && s.sendBtnDisabled]}
                    onPress={() => sendMessageWithCrisisCheck(inputText)}
                    disabled={isStreaming || !isReady}
                    activeOpacity={0.7}
                  >
                    <Text style={s.sendBtnIcon}>↑</Text>
                  </TouchableOpacity>
                ) : (
                  // Voice chat button — right side
                  <TouchableOpacity
                    style={s.pillVoiceBtn}
                    onPress={enterVoiceMode}
                    activeOpacity={0.7}
                  >
                    <VoiceChatIcon />
                  </TouchableOpacity>
                )}

              </View>
            )}

          </View>
        )}

        {/* Persistent footer — shown in both voice and text mode */}
        <Text style={[s.disclaimer, { color: isDark ? tc.textLight : '#EDE0D4' }]}>Not a substitute for emergency services</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

