// Main chat screen — text messaging with Socket.IO streaming, voice-to-text
// input (mic icon), and inline voice conversation mode (replaces input bar).
// Voice transcripts are saved to chat history identically to text messages.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, SafeAreaView, Modal, Image, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import ChatSidebar    from '../components/chat-sidebar';
import LoginModal     from '../components/login-modal';
import ChatBubble     from '../components/chat-bubble';
import TypingDots     from '../components/typing-dots';
import RecordingWave  from '../components/recording-wave';
import VoiceIndicator from '../components/voice-indicator';
import { useChat }         from '../hooks/use-chat';
import { useVoiceChat }    from '../hooks/use-voice-chat';
import { useTranscription } from '../hooks/use-transcription';
import { s }              from '../styles/chat.styles';
import { chatColors as C } from '../constants/theme';


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
const EmptyState = ({ onChip }: any) => (
  <View style={s.emptyState}>
    <Text style={s.emptyTitle}>Hi, I'm Amanda</Text>
    <Text style={s.emptySubtitle}>I'm here to listen. What's on your mind?</Text>
    <View style={s.chips}>
      {["How are you feeling today?", "I need someone to talk to", "Help me manage my stress", "I've been feeling anxious"].map(c => (
        <TouchableOpacity key={c} style={s.chip} onPress={() => onChip(c)} activeOpacity={0.7}>
          <Text style={s.chipText}>{c}</Text>
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

  const {
    voiceMode,
    voicePhase,
    voiceStatus,
    enterVoiceMode,
    exitVoiceMode,
    handleIndicatorTap,
  } = useVoiceChat({ currentChatIdRef, flatListRef, setMessages, userEmail });

  const {
    isActive:       transcriptionActive,
    isRecording:    transcriptionRecording,
    isTranscribing: transcriptionWorking,
    startRecording,
    cancelRecording,
    confirmRecording,
  } = useTranscription();

  // ── UI state — only things that affect display, nothing else ──────────
  const [showLoginModal,      setShowLoginModal]      = useState(false);
  const [showSidebar,         setShowSidebar]         = useState(false);
  const [showChatMenu,        setShowChatMenu]        = useState(false);
  const [renameModalVisible,  setRenameModalVisible]  = useState(false);
  const [renameText,          setRenameText]          = useState('');

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
    return <ChatBubble role="assistant" content={streamingText} isStreaming />;
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) return (
    <View style={s.loadingContainer}>
      <ActivityIndicator size="large" color={C.bg3} />
      <Text style={s.loadingText}>Connecting to Amanda…</Text>
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.bgLayer} pointerEvents="none" />

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
        <View style={s.header}>
          {!isAnonymous ? (
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => setShowSidebar(true)}
              activeOpacity={0.7}
            >
              <View style={s.hLine} />
              <View style={[s.hLine, { width: 14 }]} />
              <View style={s.hLine} />
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}

          <TouchableOpacity
            onPress={() => !isAnonymous && !voiceMode && setShowChatMenu(true)}
            activeOpacity={isAnonymous || voiceMode ? 1 : 0.7}
            style={s.headerTitleBtn}
          >
            <Text style={s.headerTitle} numberOfLines={1}>
              {chatTitle}{voiceMode ? ' · Voice' : ''}
            </Text>
            {!isAnonymous && !voiceMode && (
              <Text style={s.headerTitleChevron}>⌄</Text>
            )}
          </TouchableOpacity>

          {isAnonymous ? (
            <TouchableOpacity
              style={s.headerSignInBtn}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.7}
            >
              <Text style={s.headerSignInText}>Sign in</Text>
            </TouchableOpacity>
          ) : voiceMode ? (
            <TouchableOpacity
              style={s.headerSignInBtn}
              onPress={exitVoiceMode}
              activeOpacity={0.7}
            >
              <Text style={s.headerSignInText}>⌨️ Type</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}
        </View>

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
          ListEmptyComponent={<EmptyState onChip={sendMessage} />}
          ListFooterComponent={listFooter}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom bar — switches between voice mode and text mode */}
        {voiceMode ? (

          // ── Voice conversation mode ──────────────────────────────────
          <View style={s.voiceBar}>
            <Text style={s.voiceStatus}>{voiceStatus}</Text>

            {/* Indicator — disabled while Amanda is thinking or speaking */}
            <TouchableOpacity
              onPress={handleIndicatorTap}
              disabled={indicatorDisabled}
              activeOpacity={indicatorDisabled ? 1 : 0.85}
              style={{ opacity: indicatorDisabled ? 0.6 : 1 }}
            >
              <VoiceIndicator phase={voicePhase} />
            </TouchableOpacity>

            <Text style={s.voiceHint}>
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

            <Text style={s.disclaimer}>Not a substitute for emergency services</Text>
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
              <View style={[s.inputPill, inputText.length > 0 && s.inputPillFocused]}>

                {/* Mic button — left side */}
                <TouchableOpacity
                  style={s.pillMicBtn}
                  onPress={startRecording}
                  activeOpacity={0.7}
                >
                  <Feather name="mic" size={18} color={C.textMuted} />
                </TouchableOpacity>

                <TextInput
                  style={s.pillInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message Amanda..."
                  placeholderTextColor={C.textLight}
                  multiline
                  maxLength={2000}
                  editable={!isStreaming && isReady}
                  onSubmitEditing={() => sendMessage(inputText)}
                  blurOnSubmit={false}
                />

                {inputText.trim().length > 0 ? (
                  // Send button — shown when there is text to send
                  <TouchableOpacity
                    style={[s.pillSendBtn, (isStreaming || !isReady) && s.sendBtnDisabled]}
                    onPress={() => sendMessage(inputText)}
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

            <Text style={s.disclaimer}>Not a substitute for emergency services</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

