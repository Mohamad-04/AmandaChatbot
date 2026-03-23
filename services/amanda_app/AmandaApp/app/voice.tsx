import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, ScrollView,
  Easing, Platform, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { FLASK_BASE } from '../constants/api';

const VOICE_SERVER = FLASK_BASE.replace(':5000', ':8080');

const C = {
  bg:           '#0D0D0F',
  surface:      '#16161A',
  surfaceRaised:'#1E1E24',
  border:       'rgba(255,255,255,0.07)',
  accent:       '#C4A882',
  accentSoft:   'rgba(196,168,130,0.15)',
  danger:       '#E05A5A',
  dangerSoft:   'rgba(224,90,90,0.15)',
  textPrimary:  '#F0EDE8',
  textSecondary:'rgba(240,237,232,0.5)',
  textMuted:    'rgba(240,237,232,0.28)',
};

type Message    = { role: 'user' | 'assistant'; content: string };
type VoiceState = 'connecting' | 'ready' | 'recording' | 'processing' | 'speaking' | 'error';

// ─── FIX 2: Save voice exchange to shared chat ────────────────────────────────
async function saveMessagesToChat(chatId: string, userText: string, assistantText: string) {
  try {
    await fetch(`${FLASK_BASE}/api/chat/${chatId}/messages`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: userText }),
    });
    await fetch(`${FLASK_BASE}/api/chat/${chatId}/messages`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'assistant', content: assistantText }),
    });
  } catch (e) {
    console.log('Failed to save voice messages:', e);
  }
}

// ─── Pulse ring ───────────────────────────────────────────────────────────────
const PulseRing = ({ size, color, delay, active }: {
  size: number; color: string; delay: number; active: boolean;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    loop.current?.stop();
    if (active) {
      anim.setValue(0);
      loop.current = Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]));
      loop.current.start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }
  }, [active]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: color,
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
      opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] }),
    }} />
  );
};

// ─── Wave bars ────────────────────────────────────────────────────────────────
const WaveBars = ({ active, color }: { active: boolean; color: string }) => {
  const bars = Array.from({ length: 5 }, () => useRef(new Animated.Value(0.2)).current);
  useEffect(() => {
    bars.forEach((bar, i) => {
      if (!active) { Animated.spring(bar, { toValue: 0.2, useNativeDriver: true }).start(); return; }
      const animate = () => Animated.sequence([
        Animated.timing(bar, { toValue: 0.25 + Math.random() * 0.75, duration: 180 + Math.random() * 240, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bar, { toValue: 0.15 + Math.random() * 0.35, duration: 180 + Math.random() * 240, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished && active) animate(); });
      setTimeout(animate, i * 60);
    });
  }, [active]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 36 }}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: color, transform: [{ scaleY: bar }] }} />
      ))}
    </View>
  );
};

// ─── Thinking dots ────────────────────────────────────────────────────────────
const ThinkingDots = () => {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];
  useEffect(() => {
    dots.forEach((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 180),
      Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      Animated.delay(600 - i * 180),
    ])).start());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, opacity: d }} />
      ))}
    </View>
  );
};

// ─── FIX 4: Bubble matching chat.tsx structure ────────────────────────────────
const Bubble = ({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
  const isUser = role === 'user';
  return (
    <View style={[bs.row, isUser ? bs.rowUser : bs.rowAsst]}>
      {!isUser && <Image source={require('../assets/images/Amanda.jpg')} style={bs.avatar} />}
      <View style={[bs.bubble, isUser ? bs.bubbleUser : bs.bubbleAsst]}>
        <Text style={bs.text}>{content}</Text>
      </View>
    </View>
  );
};
const bs = StyleSheet.create({
  row:        { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  rowUser:    { justifyContent: 'flex-end' },
  rowAsst:    { justifyContent: 'flex-start' },
  avatar:     { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 2, flexShrink: 0 },
  bubble:     { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  bubbleUser: { backgroundColor: 'rgba(196,168,130,0.15)', borderColor: 'rgba(196,168,130,0.25)', borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleAsst: { backgroundColor: '#16161A', borderColor: 'rgba(255,255,255,0.07)', borderRadius: 18, borderBottomLeftRadius: 4 },
  text:       { color: '#F0EDE8', fontSize: 14, lineHeight: 20 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VoiceScreen() {
  const router = useRouter();

  // FIX 2: receive chatId from chat.tsx so voice saves to the same conversation
  const { chatId: routeChatId } = useLocalSearchParams<{ chatId: string }>();
  const chatId = routeChatId || null;

  const [voiceState, setVoiceState]   = useState<VoiceState>('connecting');
  const [messages, setMessages]       = useState<Message[]>([]);
  const [transcript, setTranscript]   = useState('');
  const [response, setResponse]       = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [statusText, setStatusText]   = useState('Connecting to Amanda...');

  const wsRef         = useRef<WebSocket | null>(null);
  const recordingRef  = useRef<Audio.Recording | null>(null);
  const sessionId     = useRef(`session_${Date.now()}`);
  const scrollRef     = useRef<ScrollView>(null);
  const hasConnected  = useRef(false);
  const transcriptRef = useRef('');
  const responseRef   = useRef('');

  const orbScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (voiceState === 'recording') {
      Animated.loop(Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    } else {
      orbScale.stopAnimation();
      Animated.spring(orbScale, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [voiceState]);

  useEffect(() => {
    if (!hasConnected.current) { hasConnected.current = true; connectWebSocket(); }
    return () => { wsRef.current?.close(); recordingRef.current?.stopAndUnloadAsync(); };
  }, []);

  function connectWebSocket() {
    setVoiceState('connecting');
    setStatusText('Connecting to Amanda...');
    const url = `ws://${VOICE_SERVER.replace(/^https?:\/\//, '')}/voice-stream`;
    const ws  = new WebSocket(url);
    ws.onopen = () => ws.send(JSON.stringify({
      type: 'start', user_id: 'app_user',
      chat_id: chatId || `chat_${Date.now()}`,
      session_id: sessionId.current,
    }));
    ws.onmessage = (e) => { try { handleMsg(JSON.parse(e.data)); } catch {} };
    ws.onerror   = ()  => { setVoiceState('error'); setStatusText('Connection failed — tap to retry'); };
    ws.onclose   = ()  => {};
    wsRef.current = ws;
  }

  function handleMsg(data: any) {
    switch (data.type) {
      case 'started':
        setVoiceState('ready');
        setStatusText('Tap to speak');
        break;

      case 'transcription':
      case 'transcript':
        transcriptRef.current = data.text || data.transcript || '';
        setTranscript(transcriptRef.current);
        setVoiceState('processing');
        setStatusText('Amanda is thinking...');
        break;

      case 'text_chunk':
      case 'response_text':
        responseRef.current += (data.text || '');
        setResponse(responseRef.current);
        setVoiceState('speaking');
        setStatusText('Amanda is speaking...');
        break;

      case 'audio_chunk':
      case 'audio':
        playAudio(data.data || data.audio, data.format || 'mp3');
        break;

      case 'response_complete':
      case 'complete': {
        const finalUser      = transcriptRef.current;
        const finalAssistant = responseRef.current || data.text || '';

        if (finalUser || finalAssistant) {
          setMessages(prev => [
            ...prev,
            ...(finalUser      ? [{ role: 'user'      as const, content: finalUser }]      : []),
            ...(finalAssistant ? [{ role: 'assistant' as const, content: finalAssistant }] : []),
          ]);
        }

        // FIX 2: persist to shared chat so chat.tsx shows the voice convo as text
        if (chatId && finalUser && finalAssistant) {
          saveMessagesToChat(chatId, finalUser, finalAssistant);
        }

        transcriptRef.current = '';
        responseRef.current   = '';
        setTranscript('');
        setResponse('');
        setVoiceState('ready');       // FIX 3: skip straight to ready, no "thinking" flash
        setStatusText('Tap to speak');
        break;
      }

      case 'error':
        setVoiceState('error');
        setStatusText(data.message || 'Something went wrong');
        setTimeout(() => { setVoiceState('ready'); setStatusText('Tap to speak'); }, 3000);
        break;
    }
  }

  async function playAudio(b64: string, fmt: string) {
    try {
      // FIX 1: force loud speaker output
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         false,
        playsInSilentModeIOS:       true,
        playThroughEarpieceAndroid: false,
      });
      const uri = `${FileSystem.cacheDirectory}ar.${fmt}`;
      await FileSystem.writeAsStringAsync(uri, b64, { encoding: 'base64' });
      const { sound } = await Audio.Sound.createAsync({ uri }, { volume: 1.0 });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
      });
    } catch (e) { console.log('Audio error:', e); }
  }

  const startRecording = async () => {
    if (voiceState !== 'ready') return;
    try {
      await Audio.requestPermissionsAsync();
      // FIX 1: set speaker mode before recording too
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         true,
        playsInSilentModeIOS:       true,
        playThroughEarpieceAndroid: false,
      });
      const { recording } = await Audio.Recording.createAsync({
        android: { extension: '.wav', outputFormat: Audio.AndroidOutputFormat.DEFAULT, audioEncoder: Audio.AndroidAudioEncoder.DEFAULT, sampleRate: 16000, numberOfChannels: 1, bitRate: 128000 },
        ios:     { extension: '.wav', audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: 16000, numberOfChannels: 1, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web:     {},
      });
      recordingRef.current = recording;
      setVoiceState('recording');
      setStatusText('Listening...');
    } catch { setStatusText('Microphone access denied'); }
  };

  const stopRecording = async () => {
    if (voiceState !== 'recording' || !recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri || !wsRef.current) return;
      setVoiceState('processing');
      setStatusText('Processing...');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      wsRef.current.send(JSON.stringify({ type: 'audio_chunk', data: base64, format: 'wav', is_final: true }));
    } catch { setVoiceState('ready'); setStatusText('Tap to speak'); }
  };

  const handleToggle = () => {
    if (voiceState === 'recording') stopRecording();
    else if (voiceState === 'ready') startRecording();
    else if (voiceState === 'error') connectWebSocket();
  };

  const isRecording  = voiceState === 'recording';
  const isSpeaking   = voiceState === 'speaking';
  const isThinking   = voiceState === 'processing';
  const isConnecting = voiceState === 'connecting';
  const isError      = voiceState === 'error';
  const canTap       = ['ready', 'recording', 'error'].includes(voiceState);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={[s.statusDot, { backgroundColor: isConnecting ? '#888' : isError ? C.danger : C.accent }]} />
          <Text style={s.headerName}>Amanda</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.historyBtn} onPress={() => setShowHistory(h => !h)} activeOpacity={0.7}>
            <Text style={s.historyBtnText}>{showHistory ? 'Hide chat' : 'View chat'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.switchBtn} onPress={() => router.replace('/chat')} activeOpacity={0.7}>
            <Text style={s.switchBtnText}>⌨︎  Text</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <View style={s.body}>
        {(transcript || response) ? (
          <View style={s.liveArea}>
            {transcript ? (
              <View style={s.bubbleUser}>
                <Text style={s.bubbleLabel}>You</Text>
                <Text style={s.bubbleText}>{transcript}</Text>
              </View>
            ) : null}
            {response ? (
              <View style={s.bubbleAmanda}>
                <Text style={s.bubbleLabel}>Amanda</Text>
                <Text style={s.bubbleText}>{response}</Text>
              </View>
            ) : isThinking ? (
              <View style={s.bubbleAmanda}>
                <Text style={s.bubbleLabel}>Amanda</Text>
                <ThinkingDots />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={s.idleArea}>
            {isConnecting ? <ThinkingDots /> : isError ? (
              <><Text style={s.idleTitle}>Connection lost</Text><Text style={s.idleSub}>Tap the button to reconnect</Text></>
            ) : (
              <><Text style={s.idleTitle}>Hi, I'm Amanda.</Text><Text style={s.idleSub}>Tap the button and start talking.</Text></>
            )}
          </View>
        )}

        {/* Orb */}
        <View style={s.orbWrapper}>
          <PulseRing size={140} color={isRecording ? C.danger : C.accent} delay={0}    active={isRecording || isSpeaking} />
          <PulseRing size={140} color={isRecording ? C.danger : C.accent} delay={600}  active={isRecording || isSpeaking} />
          <PulseRing size={140} color={isRecording ? C.danger : C.accent} delay={1200} active={isRecording} />
          <Animated.View style={{ transform: [{ scale: orbScale }] }}>
            <TouchableOpacity
              onPress={handleToggle} disabled={!canTap} activeOpacity={0.88}
              style={[s.orb, {
                backgroundColor: isRecording || isError ? C.dangerSoft : C.accentSoft,
                borderColor:     isRecording || isError ? C.danger     : C.accent,
              }, !canTap && { opacity: 0.45 }]}
            >
              {isThinking || isConnecting ? <ThinkingDots /> : (
                <WaveBars active={isRecording || isSpeaking} color={isRecording ? C.danger : C.accent} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={s.statusRow}>
          {isRecording && <View style={s.recDot} />}
          <Text style={[s.statusText, isError && { color: C.danger }]}>{statusText}</Text>
        </View>
        {voiceState === 'ready' && <Text style={s.hint}>Tap once to start · Tap again to send</Text>}
      </View>

      {/* FIX 4: history panel with chat-style bubbles */}
      {showHistory && (
        <View style={s.historyPanel}>
          <View style={s.historyHandle} />
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={s.historyContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <Text style={s.historyEmpty}>Your conversation will appear here.</Text>
            ) : (
              messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  headerName:     { fontSize: 17, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.3 },
  historyBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  historyBtnText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  switchBtn:      { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.accentSoft, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(196,168,130,0.25)' },
  switchBtnText:  { fontSize: 13, color: C.accent, fontWeight: '600' },

  body:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 28 },
  liveArea:     { width: '100%', gap: 10 },
  bubbleUser:   { alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: C.surfaceRaised, borderRadius: 18, borderBottomRightRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14 },
  bubbleAmanda: { alignSelf: 'flex-start', maxWidth: '80%', backgroundColor: C.surface, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14 },
  bubbleLabel:  { fontSize: 10, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  bubbleText:   { fontSize: 15, color: C.textPrimary, lineHeight: 22 },

  idleArea:  { alignItems: 'center', gap: 8 },
  idleTitle: { fontSize: 22, fontWeight: '300', color: C.textPrimary, letterSpacing: -0.5 },
  idleSub:   { fontSize: 15, color: C.textSecondary },

  orbWrapper: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  orb: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    ...Platform.select({
      ios:     { shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  recDot:    { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.danger },
  statusText:{ fontSize: 15, color: C.textSecondary, fontWeight: '500', letterSpacing: -0.2 },
  hint:      { fontSize: 12, color: C.textMuted, letterSpacing: 0.1 },

  historyPanel:   { height: '42%', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12 },
  historyHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 12 },
  historyContent: { paddingHorizontal: 16, paddingBottom: 24 },
  historyEmpty:   { color: C.textMuted, fontSize: 14, textAlign: 'center', paddingTop: 20 },
});