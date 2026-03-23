import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, SafeAreaView, Modal, Image, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { io } from 'socket.io-client';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import ChatSidebar from '../components/ChatSidebar';
import LoginModal from '../components/loginModal';
import { FLASK_BASE } from '../constants/api';

const VOICE_SERVER = FLASK_BASE.replace(':5000', ':8080');

const C = {
  bg1:        '#DDD0C4',
  bg3:        '#A87A74',
  text:       '#2d1e1c',
  textMuted:  '#6b4e4b',
  textLight:  '#a89290',
  cardBorder: 'rgba(168,122,116,0.25)',
  userBubble: 'rgba(241,227,211,0.65)',
  asstBubble: 'rgba(241,227,211,0.65)',
  inputBg:    'rgba(241,227,211,0.55)',
  inputBorder:'rgba(168,122,116,0.20)',
  sendBg:     'rgba(45,30,28,0.12)',
  sendBorder: 'rgba(45,30,28,0.15)',
  dark:       '#2d1e1c',
  danger:     '#c0392b',
};

// ─── API ─────────────────────────────────────────────────────────────────────
const api = {
  async checkAuth() {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/auth/check`, { credentials: 'include' });
      const data = await r.json();
      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: { authenticated: false } };
    }
  },
  async listChats() {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/chat/list`, { credentials: 'include' });
      const data = await r.json();
      return { success: true, data };
    } catch {
      return { success: false, data: {} };
    }
  },
  async createChat() {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/chat/create`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      return { success: true, data };
    } catch {
      return { success: false, data: {} };
    }
  },
  async getMessages(chatId: any) {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/chat/${chatId}/messages`, { credentials: 'include' });
      const data = await r.json();
      return { success: true, data };
    } catch {
      return { success: false, data: {} };
    }
  },
  async renameChat(chatId: any, title: string) {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/chat/${chatId}/rename`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await r.json();
      return { success: true, data };
    } catch {
      return { success: false, data: {} };
    }
  },
  async deleteChat(chatId: any) {
    try {
      const r    = await fetch(`${FLASK_BASE}/api/chat/${chatId}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await r.json();
      return { success: true, data };
    } catch {
      return { success: false, data: {} };
    }
  },
};

// ─── WAVE BARS (for voice chat button) ───────────────────────────────────────
const VoiceChatIcon = () => {
  const bars = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.8)).current,
    useRef(new Animated.Value(0.5)).current,
  ];

  useEffect(() => {
    bars.forEach((bar, i) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 400 + Math.random() * 400,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.4,
            duration: 400 + Math.random() * 400,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => { if (finished) animate(); });
      };
      setTimeout(animate, i * 120);
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            backgroundColor: C.text,
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  );
};

// ─── RECORDING WAVE BARS (for inline voice input) ────────────────────────────
const RecordingWave = ({ active }: { active: boolean }) => {
  const bars = Array.from({ length: 20 }, () => useRef(new Animated.Value(0.2)).current);

  useEffect(() => {
    if (!active) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.2, duration: 200, useNativeDriver: true }).start());
      return;
    }
    bars.forEach((bar, i) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.1 + Math.random() * 0.9,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.1 + Math.random() * 0.3,
            duration: 100 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => { if (finished && active) animate(); });
      };
      setTimeout(animate, i * 30);
    });
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, height: 32, paddingHorizontal: 8 }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 32,
            borderRadius: 2,
            backgroundColor: C.bg3,
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  );
};

// ─── BUBBLE ──────────────────────────────────────────────────────────────────
const Bubble = React.memo(({ role, content, isStreaming }: any) => {
  const isUser = role === 'user';
  return (
    <View style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowAsst]}>
      {!isUser && (
        <Image source={require('../assets/images/Amanda.jpg')} style={s.avatar} />
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAsst]}>
        <Text style={s.bubbleText}>
          {content}
          {isStreaming && <Text style={s.cursor}>▌</Text>}
        </Text>
      </View>
    </View>
  );
});

// ─── TYPING DOTS ─────────────────────────────────────────────────────────────
const TypingDots = () => {
  const [dot, setDot] = useState(0);
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
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
const EmptyState = ({ onChip }: any) => {
  const chips = [
    "How are you feeling today?",
    "I need someone to talk to",
    "Help me manage my stress",
    "I've been feeling anxious",
  ];
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyTitle}>Hi, I'm Amanda</Text>
      <Text style={s.emptySubtitle}>I'm here to listen. What's on your mind?</Text>
      <View style={s.chips}>
        {chips.map(c => (
          <TouchableOpacity key={c} style={s.chip} onPress={() => onChip(c)} activeOpacity={0.7}>
            <Text style={s.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { chatId: routeChatId } = useLocalSearchParams();
  const router = useRouter();

  const [currentChatId, setCurrentChatId]   = useState<any>(routeChatId || null);
  const [messages, setMessages]             = useState<any[]>([]);
  const [isStreaming, setIsStreaming]        = useState(false);
  const [streamingText, setStreamingText]   = useState('');
  const [inputText, setInputText]           = useState('');
  const [isReady, setIsReady]               = useState(false);
  const [isLoading, setIsLoading]           = useState(true);
  const [isAnonymous, setIsAnonymous]       = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSidebar, setShowSidebar]       = useState(false);
  const [userEmail, setUserEmail]           = useState('');
  const [chatTitle, setChatTitle]           = useState('Amanda');
  const [showChatMenu, setShowChatMenu]     = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameText, setRenameText]         = useState('');

  // Voice-to-text state
  const [voiceMode, setVoiceMode]           = useState(false);
  const [isRecording, setIsRecording]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef                        = useRef<Audio.Recording | null>(null);
  const voiceWsRef                          = useRef<WebSocket | null>(null);

  const socketRef        = useRef<any>(null);
  const streamingTextRef = useRef('');
  const flatListRef      = useRef<any>(null);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function boot() {
        setIsLoading(true);
        const auth     = await api.checkAuth();
        const loggedIn = auth.success && auth?.data?.authenticated;

        if (!loggedIn) {
          if (active) {
            setIsAnonymous(true);
            setShowLoginModal(true);
            setIsLoading(false);
            if (!socketRef.current?.connected) connectSocket(null);
          }
          return;
        }

        if (active) {
          setIsAnonymous(false);
          setShowLoginModal(false);
          if (auth.data?.user?.email) setUserEmail(auth.data.user.email);
        }

        let chatId = currentChatId;
        if (!chatId) {
          const list = await api.listChats();
          if (list.success && list.data?.chats?.length > 0) {
            chatId = list.data.chats[0].id;
            if (active) setChatTitle(list.data.chats[0].title || 'New Chat');
          } else {
            const created = await api.createChat();
            if (created.success && active) {
              chatId = created.data.chat_id;
              setChatTitle(created.data.title || 'New Chat');
            }
          }
          if (active) setCurrentChatId(chatId);
        }

        if (chatId && active) {
          const msgs = await api.getMessages(chatId);
          if (msgs.success && msgs.data?.messages?.length > 0) {
            setMessages(msgs.data.messages.map((m: any) => ({ role: m.role, content: m.content })));
          }
        }

        if (!socketRef.current?.connected) connectSocket(chatId);
        if (active) setIsLoading(false);
      }

      boot();
      return () => {
        active = false;
        socketRef.current?.disconnect();
        voiceWsRef.current?.close();
      };
    }, [])
  );

  // ── Socket ────────────────────────────────────────────────────────────────
  function connectSocket(chatId: any) {
    const socket = io(FLASK_BASE, { withCredentials: true, transports: ['websocket'] });
    socket.on('connect',       () => setIsReady(true));
    socket.on('connect_error', (err: any) => console.log('CONNECT ERROR', err.message));
    socket.on('disconnect',    () => setIsReady(false));
    socket.on('message_token', (data: any) => {
      streamingTextRef.current += data.text;
      setStreamingText(streamingTextRef.current);
    });
    socket.on('message_complete', (data: any) => {
      const finalText = data.full_text || streamingTextRef.current;
      setMessages(prev => [...prev, { role: 'assistant', content: finalText }]);
      streamingTextRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
    });
    socket.on('error', () => {
      streamingTextRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
    });
    socketRef.current = socket;
  }

  // ── Voice to text ─────────────────────────────────────────────────────────
  const startVoiceMode = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      recordingRef.current = recording;
      setVoiceMode(true);
      setIsRecording(true);
    } catch (e) {
      console.log('Recording error:', e);
    }
  };

  const cancelVoiceMode = async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
    } catch {}
    recordingRef.current = null;
    setVoiceMode(false);
    setIsRecording(false);
    setIsTranscribing(false);
  };

  const confirmVoice = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { cancelVoiceMode(); return; }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      // Connect to voice server for transcription only
      const ws = new WebSocket(`ws://${VOICE_SERVER.replace('http://', '')}/voice-stream`);
      voiceWsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'start',
          user_id: 'app_user',
          chat_id: `chat_${Date.now()}`,
          session_id: `vtt_${Date.now()}`,
        }));
      };

      ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  
  if (data.type === 'started') {
    // Send audio then immediately prepare to close
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: base64,
      format: 'wav',
      is_final: true,
    }));
  }
  
  if (data.type === 'transcription' || data.type === 'transcript') {
    const text = data.text || data.transcript || '';
    setInputText(text);
    setVoiceMode(false);
    setIsTranscribing(false);
    ws.close(); // ← close immediately, cutting off AI response
  }

  if (data.type === 'error') {
    setVoiceMode(false);
    setIsTranscribing(false);
    ws.close();
  }};

      ws.onerror = () => {
        setVoiceMode(false);
        setIsTranscribing(false);
      };

    } catch (e) {
      console.log('Voice to text error:', e);
      cancelVoiceMode();
    }
  }

  // ── Load chat ─────────────────────────────────────────────────────────────
  const loadChat = useCallback(async (chatId: any, title?: string) => {
    setMessages([]);
    setCurrentChatId(chatId);
    if (title) setChatTitle(title);
    const msgs = await api.getMessages(chatId);
    if (msgs.success && msgs.data?.messages?.length > 0) {
      setMessages(msgs.data.messages.map((m: any) => ({ role: m.role, content: m.content })));
    }
  }, []);

  // ── Rename ────────────────────────────────────────────────────────────────
  const handleRename = async () => {
    if (!renameText.trim() || !currentChatId) return;
    const result = await api.renameChat(currentChatId, renameText.trim());
    if (result.success) {
      setChatTitle(renameText.trim());
      setRenameModalVisible(false);
      setRenameText('');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!currentChatId) return;
    setShowChatMenu(false);
    await api.deleteChat(currentChatId);
    const created = await api.createChat();
    if (created.success) {
      setCurrentChatId(created.data.chat_id);
      setChatTitle(created.data.title || 'New Chat');
      setMessages([]);
    }
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    const msg = text.trim();
    if (!msg || isStreaming || !socketRef.current?.connected) return;
    const chatId = currentChatId || 'anonymous_session';
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputText('');
    setIsStreaming(true);
    streamingTextRef.current = '';
    setStreamingText('');
    socketRef.current.emit('send_message', { chat_id: chatId, message: msg });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [currentChatId, isStreaming]);

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, streamingText]);

  const renderItem = useCallback(({ item }: any) => (
    <Bubble role={item.role} content={item.content} />
  ), []);

  const listFooter = () => {
    if (!isStreaming) return null;
    if (!streamingText) return <TypingDots />;
    return <Bubble role="assistant" content={streamingText} isStreaming />;
  };

  const handleLogin     = () => { setShowLoginModal(false); router.push('/login?from=chat' as any); };
  const handleSignup    = () => { setShowLoginModal(false); router.push('/signup?from=chat' as any); };
  const handleAnonymous = () => { setShowLoginModal(false); };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={C.bg3} />
        <Text style={s.loadingText}>Connecting to Amanda…</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.bgLayer} pointerEvents="none" />

      <LoginModal
        visible={showLoginModal}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onAnonymous={handleAnonymous}
      />

      {!isAnonymous && (
        <ChatSidebar
          visible={showSidebar}
          onClose={() => setShowSidebar(false)}
          currentChatId={currentChatId}
          onSelectChat={loadChat}
          onNewChat={async () => {
            const created = await api.createChat();
            if (created.success) {
              setCurrentChatId(created.data.chat_id);
              setChatTitle(created.data.title || 'New Chat');
              setMessages([]);
            }
          }}
          userEmail={userEmail}
          aiModel="GPT-5.1"
        />
      )}

      {/* Chat action menu */}
      <Modal visible={showChatMenu} transparent animationType="fade" onRequestClose={() => setShowChatMenu(false)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setShowChatMenu(false)}>
          <View style={s.menuCard}>
            <Text style={s.menuHeading} numberOfLines={1}>{chatTitle}</Text>
            <TouchableOpacity style={s.menuRow} activeOpacity={0.7} onPress={() => {
              setShowChatMenu(false);
              setRenameText(chatTitle);
              setRenameModalVisible(true);
            }}>
              <Text style={s.menuRowIcon}>✏️</Text>
              <Text style={s.menuRowText}>Rename</Text>
            </TouchableOpacity>
            <View style={s.menuSeparator} />
            <TouchableOpacity style={s.menuRow} activeOpacity={0.7} onPress={handleDelete}>
              <Text style={s.menuRowIcon}>🗑️</Text>
              <Text style={[s.menuRowText, s.menuRowTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename modal */}
      <Modal visible={renameModalVisible} transparent animationType="fade" onRequestClose={() => setRenameModalVisible(false)}>
        <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={() => setRenameModalVisible(false)}>
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
              onSubmitEditing={handleRename}
            />
            <View style={s.renameActions}>
              <TouchableOpacity style={s.renameBtnCancel} onPress={() => setRenameModalVisible(false)} activeOpacity={0.7}>
                <Text style={s.renameBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.renameBtnSave} onPress={handleRename} activeOpacity={0.85}>
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
        {/* Header */}
        <View style={s.header}>
          {!isAnonymous ? (
            <TouchableOpacity style={s.headerBtn} onPress={() => setShowSidebar(true)} activeOpacity={0.7}>
              <View style={s.hLine} />
              <View style={[s.hLine, { width: 14 }]} />
              <View style={s.hLine} />
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}

          <TouchableOpacity
            onPress={() => !isAnonymous && setShowChatMenu(true)}
            activeOpacity={isAnonymous ? 1 : 0.7}
            style={s.headerTitleBtn}
          >
            <Text style={s.headerTitle} numberOfLines={1}>{chatTitle}</Text>
            {!isAnonymous && <Text style={s.headerTitleChevron}>⌄</Text>}
          </TouchableOpacity>

          {isAnonymous ? (
            <TouchableOpacity style={s.headerSignInBtn} onPress={() => setShowLoginModal(true)} activeOpacity={0.7}>
              <Text style={s.headerSignInText}>Sign in</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.headerBtn} />
          )}
        </View>

        {/* Anonymous banner */}
        {isAnonymous && (
          <TouchableOpacity style={s.anonBanner} onPress={() => setShowLoginModal(true)} activeOpacity={0.8}>
            <Text style={s.anonBannerText}>
              💬 Chatting anonymously — messages won't be saved.{' '}
              <Text style={s.anonBannerLink}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Messages */}
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

        {/* ── Input Area ── */}
        <View style={s.inputArea}>

          {voiceMode ? (
            // ── Voice recording bar ──
            <View style={s.voiceBar}>

              {/* Cancel */}
              <TouchableOpacity style={s.voiceBarBtn} onPress={cancelVoiceMode} activeOpacity={0.7}>
                <Text style={s.voiceBarX}>✕</Text>
              </TouchableOpacity>

              {/* Wave animation */}
              {isTranscribing ? (
                <View style={s.voiceBarMiddle}>
                  <ActivityIndicator color={C.bg3} size="small" />
                  <Text style={s.voiceBarTranscribingText}>Transcribing...</Text>
                </View>
              ) : (
                <RecordingWave active={isRecording} />
              )}

              {/* Confirm */}
              <TouchableOpacity
                style={[s.voiceBarBtn, s.voiceBarConfirm]}
                onPress={confirmVoice}
                disabled={isTranscribing}
                activeOpacity={0.7}
              >
                <Text style={s.voiceBarTick}>✓</Text>
              </TouchableOpacity>

            </View>
          ) : (
            // ── Normal text input ──
            <View style={[s.inputBox, inputText.length > 0 && s.inputBoxFocused]}>
              <TextInput
                style={s.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message…"
                placeholderTextColor={C.textLight}
                multiline
                maxLength={2000}
                editable={!isStreaming && isReady}
                onSubmitEditing={() => sendMessage(inputText)}
                blurOnSubmit={false}
              />
              <View style={s.inputActions}>
                <View style={{ flex: 1 }} />

                {inputText.trim().length > 0 ? (
                  // Send button when typing
                  <TouchableOpacity
                    style={[s.sendBtn, (isStreaming || !isReady) && s.sendBtnDisabled]}
                    onPress={() => sendMessage(inputText)}
                    disabled={isStreaming || !isReady}
                    activeOpacity={0.7}
                  >
                    <Text style={s.sendBtnIcon}>↑</Text>
                  </TouchableOpacity>
                ) : (
                  // Two voice buttons when not typing
                  <View style={s.voiceBtns}>

                    {/* Button 1: Voice to text (mic outline) */}
                    <TouchableOpacity
                      style={s.voiceToTextBtn}
                      onPress={startVoiceMode}
                      activeOpacity={0.7}
                    >
                      <Text style={s.voiceToTextIcon}>🎤</Text>
                    </TouchableOpacity>

                    {/* Button 2: Full voice chat (round with waves) */}
                    <TouchableOpacity
                      style={s.voiceChatBtn}
                      onPress={() => router.push('/voice' as any)}
                      activeOpacity={0.7}
                    >
                      <VoiceChatIcon />
                    </TouchableOpacity>

                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={s.disclaimer}>Not a substitute for emergency services</Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg1 },
  flex:    { flex: 1 },
  bgLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg1 },

  loadingContainer: { flex: 1, backgroundColor: C.bg1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText:      { color: C.textMuted, fontSize: 15, fontWeight: '500' },

  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(241,227,211,0.40)', borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.15)' },
  headerBtn:          { width: 56, height: 36, alignItems: 'center', justifyContent: 'center', gap: 4 },
  headerTitleBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle:        { fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: -0.3, maxWidth: 160 },
  headerTitleChevron: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  headerSignInBtn:    { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.sendBg, borderWidth: 1, borderColor: C.sendBorder, borderRadius: 20 },
  headerSignInText:   { fontSize: 13, fontWeight: '600', color: C.text },
  hLine:              { width: 20, height: 2, backgroundColor: C.text, borderRadius: 2 },

  anonBanner:     { backgroundColor: 'rgba(168,122,116,0.12)', borderBottomWidth: 1, borderBottomColor: 'rgba(168,122,116,0.18)', paddingHorizontal: 16, paddingVertical: 10 },
  anonBannerText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
  anonBannerLink: { color: C.text, fontWeight: '600', textDecorationLine: 'underline' },

  listContent:    { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, flexGrow: 1 },
  messageRow:     { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAsst: { justifyContent: 'flex-start' },
  avatar:         { width: 30, height: 30, borderRadius: 15, marginRight: 10, marginBottom: 2, flexShrink: 0 },
  bubble:         { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1 },
  bubbleUser:     { backgroundColor: C.userBubble, borderColor: C.cardBorder, borderRadius: 20, borderBottomRightRadius: 4 },
  bubbleAsst:     { backgroundColor: C.asstBubble, borderColor: C.cardBorder, borderRadius: 20, borderBottomLeftRadius: 4 },
  bubbleText:     { color: C.text, fontSize: 15, lineHeight: 22 },
  cursor:         { color: C.textMuted, opacity: 0.7 },

  emptyState:    { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle:    { fontSize: 32, fontWeight: '600', color: C.text, marginBottom: 10, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 15, color: C.textMuted, marginBottom: 32, textAlign: 'center' },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip:          { backgroundColor: 'rgba(241,227,211,0.60)', borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  chipText:      { color: '#5a3d3a', fontSize: 14 },

  // Input
  inputArea:       { paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  inputBox:        { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  inputBoxFocused: { borderColor: 'rgba(168,122,116,0.40)', backgroundColor: 'rgba(241,227,211,0.72)' },
  input:           { color: C.text, fontSize: 15, lineHeight: 22, maxHeight: 120, minHeight: 24, paddingTop: 0, paddingBottom: 0 },
  inputActions:    { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sendBtn:         { width: 34, height: 34, borderRadius: 8, backgroundColor: C.sendBg, borderWidth: 1, borderColor: C.sendBorder, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnIcon:     { color: C.text, fontSize: 18, fontWeight: '600', lineHeight: 22 },
  disclaimer:      { textAlign: 'center', fontSize: 11, color: C.textLight, marginTop: 8 },

  // Two voice buttons
  voiceBtns:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceToTextBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1.5, borderColor: C.bg3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  voiceToTextIcon:{ fontSize: 18 },
  voiceChatBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' },

  // Voice recording bar
  voiceBar:               { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, minHeight: 54 },
  voiceBarBtn:            { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  voiceBarX:              { fontSize: 16, color: C.textMuted, fontWeight: '600' },
  voiceBarConfirm:        { backgroundColor: C.bg3 },
  voiceBarTick:           { fontSize: 18, color: 'white', fontWeight: '700' },
  voiceBarMiddle:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  voiceBarTranscribingText: { fontSize: 13, color: C.textMuted },

  // Menus
  menuOverlay:       { flex: 1, backgroundColor: 'rgba(45,30,28,0.35)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100 },
  menuCard:          { width: 220, backgroundColor: 'rgba(241,227,211,0.98)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(168,122,116,0.22)', overflow: 'hidden', shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 12 },
  menuHeading:       { fontSize: 13, fontWeight: '600', color: C.textLight, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  menuSeparator:     { height: 1, backgroundColor: 'rgba(168,122,116,0.12)' },
  menuRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  menuRowIcon:       { fontSize: 16 },
  menuRowText:       { fontSize: 15, fontWeight: '500', color: C.text },
  menuRowTextDanger: { color: '#c0392b' },

  renameCard:          { width: '85%', backgroundColor: 'rgba(241,227,211,0.98)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(168,122,116,0.22)', padding: 24, shadowColor: '#2d1e1c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 12 },
  renameTitle:         { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16, letterSpacing: -0.3 },
  renameInput:         { backgroundColor: 'rgba(168,122,116,0.10)', borderWidth: 1, borderColor: 'rgba(168,122,116,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, marginBottom: 16 },
  renameActions:       { flexDirection: 'row', gap: 10 },
  renameBtnCancel:     { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(45,30,28,0.15)', alignItems: 'center' },
  renameBtnCancelText: { fontSize: 15, fontWeight: '500', color: C.textMuted },
  renameBtnSave:       { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.dark, alignItems: 'center' },
  renameBtnSaveText:   { fontSize: 15, fontWeight: '700', color: 'white' },
});