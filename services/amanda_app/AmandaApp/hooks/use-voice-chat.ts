// Handles the full voice conversation mode where Amanda speaks back.
// Manages the WebSocket connection to the voice server, audio recording
// with automatic voice detection (VAD), and playing Amanda's spoken responses.
// This is separate from simple voice-to-text transcription (use-transcription.ts).
//
// Conversation flow:
//   user taps indicator → listening (VAD detects silence) → thinking → speaking → idle

import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { VOICE_SERVER_URL, VAD_THRESHOLD, SILENCE_DURATION, MIN_SPEECH_MS } from '../constants/config';
import { VoicePhase } from '../components/voice-indicator';

// Everything the chat screen needs from this hook
interface UseVoiceChatReturn {
  voiceMode:      boolean;
  voicePhase:     VoicePhase;
  voiceStatus:    string;
  voiceConnected: boolean;
  enterVoiceMode: () => void;
  exitVoiceMode:  () => void;
  handleIndicatorTap: () => Promise<void>;
  setMessages:    (updater: (prev: any[]) => any[]) => void;
  flatListRef:    React.MutableRefObject<any>;
}

interface UseVoiceChatOptions {
  // Current chat ID so voice transcripts can be saved to the right conversation
  currentChatIdRef: React.MutableRefObject<number | null>;
  // Shared flatListRef from use-chat so voice transcripts trigger the same scroll
  flatListRef:      React.MutableRefObject<any>;
  // Shared setMessages from use-chat so transcripts appear in the message list
  setMessages:      React.Dispatch<React.SetStateAction<any[]>>;
}

export function useVoiceChat({
  currentChatIdRef,
  flatListRef,
  setMessages,
}: UseVoiceChatOptions) {
  // ── Voice mode state ───────────────────────────────────────────────────
  const [voiceMode,      setVoiceMode]      = useState(false);
  const [voicePhase,     setVoicePhase]     = useState<VoicePhase>('idle');
  const [voiceStatus,    setVoiceStatus]    = useState('Tap the indicator to start');
  const [voiceConnected, setVoiceConnected] = useState(false);

  // ── Voice refs ─────────────────────────────────────────────────────────
  const voiceWsRef        = useRef<WebSocket | null>(null);
  const voiceRecRef       = useRef<Audio.Recording | null>(null);
  const voiceSoundRef     = useRef<Audio.Sound | null>(null);

  // Audio chunks waiting to be played — played sequentially, never interrupted
  const voiceQueueRef     = useRef<Array<{ data: string; format: string }>>([]);
  const voicePlayingRef   = useRef(false);

  // Prevents double-sending audio in the same VAD cycle
  const voiceHasSentRef   = useRef(false);

  // VAD timing refs — track when speech starts and ends
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef    = useRef<number | null>(null);
  const lastSpeechRef     = useRef<number | null>(null);

  // Generation counter — used to discard stale audio playback callbacks
  const audioGenRef       = useRef(0);

  // ── Recording config ───────────────────────────────────────────────────
  // 16kHz mono WAV — required by the voice server
  const RECORDING_OPTIONS = {
    android: {
      extension:        '.wav',
      outputFormat:     Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder:     Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate:       16000,
      numberOfChannels: 1,
      bitRate:          128000,
    },
    ios: {
      extension:            '.wav',
      audioQuality:         Audio.IOSAudioQuality.HIGH,
      sampleRate:           16000,
      numberOfChannels:     1,
      bitRate:              128000,
      linearPCMBitDepth:    16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat:     false,
    },
    web: {},
  };

  // ── Cleanup — stops all audio, closes socket, resets all refs ─────────
  const voiceCleanup = () => {
    if (silenceTimerRef.current)   { clearTimeout(silenceTimerRef.current);   silenceTimerRef.current   = null; }
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }

    voiceRecRef.current?.stopAndUnloadAsync().catch(() => {});
    voiceRecRef.current = null;

    voiceSoundRef.current?.unloadAsync().catch(() => {});
    voiceSoundRef.current = null;

    voiceQueueRef.current   = [];
    voicePlayingRef.current = false;
    speechStartRef.current  = null;
    lastSpeechRef.current   = null;

    voiceWsRef.current?.close();
    voiceWsRef.current = null;

    setVoiceConnected(false);
  };

  // ── Enter / exit voice mode ────────────────────────────────────────────
  const enterVoiceMode = () => {
    setVoiceMode(true);
    setVoicePhase('idle');
    setVoiceStatus('Tap the indicator to start');
    connectVoiceWS();
  };

  const exitVoiceMode = () => {
    setVoiceMode(false);
    setVoicePhase('idle');
    voiceCleanup();
  };

  // ── WebSocket connection to voice server ───────────────────────────────
  // Reconnects automatically every 2 seconds if connection drops
  const connectVoiceWS = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Skip if already open or connecting
    if (voiceWsRef.current &&
      (voiceWsRef.current.readyState === WebSocket.OPEN ||
       voiceWsRef.current.readyState === WebSocket.CONNECTING)) return;

    const ws = new WebSocket(
      `ws://${VOICE_SERVER_URL.replace(/^https?:\/\//, '')}/voice-stream`
    );
    voiceWsRef.current = ws;

    ws.onopen = () => {
      setVoiceConnected(true);
      ws.send(JSON.stringify({
        type:       'start',
        user_id:    'app_user',
        chat_id:    `voice_${Date.now()}`,
        session_id: `vs_${Date.now()}`,
      }));
    };

    ws.onmessage = (e) => {
      try { handleVoiceMessage(JSON.parse(e.data)); } catch {}
    };

    // Auto-reconnect on close
    ws.onclose = () => {
      setVoiceConnected(false);
      reconnectTimerRef.current = setTimeout(connectVoiceWS, 2000);
    };

    ws.onerror = () => setVoiceConnected(false);
  }, []);

  // ── Handle incoming messages from the voice server ─────────────────────
  const handleVoiceMessage = useCallback((d: any) => {
    switch (d.type) {

      // Server status update — map to voice phase
      case 'status':
        if (['thinking', 'processing', 'transcribing'].includes(d.status)) {
          setVoicePhase('thinking');
          setVoiceStatus('Amanda is thinking…');
        } else if (['speaking', 'synthesizing'].includes(d.status)) {
          setVoicePhase('speaking');
          setVoiceStatus('Amanda is speaking…');
        }
        break;

      // Final transcript — save to chat history and display in message list
      case 'transcript':
        if (d.is_final && d.text?.trim()) {
          const text = d.text.trim();
          const role = d.role === 'user' ? 'user' : 'assistant';
          setMessages(prev => [...prev, { role, content: text }]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

          // Persist to backend so transcript survives across sessions
          if (currentChatIdRef.current) {
            saveMessage(currentChatIdRef.current, role, text);
          }
        }
        break;

      // Audio chunk — add to playback queue
      case 'audio_chunk':
        voiceQueueRef.current.push({ data: d.data, format: d.format || 'mp3' });
        playVoiceQueue();
        break;

      // Server error — reset to idle so user can try again
      case 'error':
        console.log('[VoiceChat] server error:', d.error);
        setVoicePhase('idle');
        setVoiceStatus('Something went wrong — tap to try again');
        voiceHasSentRef.current = false;
        break;
    }
  }, []);

  // ── Audio playback queue ───────────────────────────────────────────────
  // Plays chunks one at a time — Amanda never gets interrupted mid-sentence
  const playVoiceQueue = useCallback(async () => {
    const gen = audioGenRef.current;
    if (voicePlayingRef.current) return;

    if (voiceQueueRef.current.length === 0) {
      // All audio finished — return to idle, ready for next user tap
      setVoicePhase('idle');
      setVoiceStatus('Tap the indicator to speak');
      voiceHasSentRef.current = false;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:   true,
        playsInSilentModeIOS: true,
      });
      return;
    }

    voicePlayingRef.current = true;
    const { data: base64, format } = voiceQueueRef.current.shift()!;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:       false,
        playsInSilentModeIOS:     true,
        staysActiveInBackground:  false,
        shouldDuckAndroid:        true,
        playThroughEarpieceAndroid: false,
      });

      setVoicePhase('speaking');

      // Write audio chunk to a temp file so expo-av can play it
      const uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.${format}`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Unload previous sound before creating a new one
      if (voiceSoundRef.current) {
        await voiceSoundRef.current.stopAsync().catch(() => {});
        await voiceSoundRef.current.unloadAsync().catch(() => {});
        voiceSoundRef.current = null;
      }

      // Bail if a new voice generation started while we were preparing
      if (audioGenRef.current !== gen) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: 1.0 }
      );
      voiceSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (st: any) => {
        // Ignore callbacks from a stale generation
        if (audioGenRef.current !== gen) return;

        if (st.isLoaded && st.didJustFinish) {
          voicePlayingRef.current = false;
          await sound.unloadAsync().catch(() => {});
          if (voiceSoundRef.current === sound) voiceSoundRef.current = null;
          playVoiceQueue(); // play next chunk
        }

        if (!st.isLoaded && st.error) {
          voicePlayingRef.current = false;
          playVoiceQueue();
        }
      });

      await sound.playAsync();

    } catch (e) {
      console.log('[VoiceChat] playback error:', e);
      voicePlayingRef.current = false;
      if (audioGenRef.current === gen) playVoiceQueue();
    }
  }, []);

  // ── Voice activity detection (VAD) recording ───────────────────────────
  // Monitors mic volume — automatically sends when silence is detected
  const startVoiceListening = useCallback(async () => {
    if (voiceRecRef.current) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS:   true,
        playsInSilentModeIOS: true,
      });

      voiceHasSentRef.current = false;
      speechStartRef.current  = null;
      lastSpeechRef.current   = null;

      setVoicePhase('listening');
      setVoiceStatus('Listening… speak freely');

      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS,
        (status) => {
          if (!status.isRecording) return;

          // Convert metering dB value to 0–1 amplitude
          const level     = (status as any).metering ?? -60;
          const amplitude = Math.max(0, (level + 60) / 60);
          const now       = Date.now();

          if (amplitude > VAD_THRESHOLD) {
            // Speech detected — reset silence timer
            lastSpeechRef.current = now;
            if (!speechStartRef.current) speechStartRef.current = now;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else {
            // Silence detected — start countdown to auto-send
            const speechDuration = speechStartRef.current ? now - speechStartRef.current : 0;
            if (
              lastSpeechRef.current &&
              speechDuration >= MIN_SPEECH_MS &&
              !silenceTimerRef.current &&
              !voiceHasSentRef.current
            ) {
              silenceTimerRef.current = setTimeout(() => {
                silenceTimerRef.current = null;
                speechStartRef.current  = null;
                lastSpeechRef.current   = null;
                voiceHasSentRef.current = true;
                sendVoiceAudio();
              }, SILENCE_DURATION);
            }
          }
        },
        100 // poll metering every 100ms
      );

      voiceRecRef.current = recording;

    } catch (e) {
      console.log('[VoiceChat] startVoiceListening error:', e);
    }
  }, []);

  // ── Send recorded audio to the voice server ────────────────────────────
  const sendVoiceAudio = async () => {
    if (!voiceRecRef.current) return;

    setVoicePhase('thinking');
    setVoiceStatus('Amanda is thinking…');

    try {
      await voiceRecRef.current.stopAndUnloadAsync();
      const uri = voiceRecRef.current.getURI();
      voiceRecRef.current = null;
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      voiceWsRef.current?.send(JSON.stringify({
        type:     'audio_chunk',
        data:     base64,
        format:   'wav',
        is_final: true,
      }));

    } catch (e) {
      console.log('[VoiceChat] sendVoiceAudio error:', e);
      voiceHasSentRef.current = false;
      setVoicePhase('listening');
      setVoiceStatus('Could not send — tap to retry');
    }
  };

  // ── Indicator tap handler ──────────────────────────────────────────────
  // idle → start listening
  // listening → manual early send
  // thinking / speaking → do nothing, Amanda must finish first
  const handleIndicatorTap = async () => {
    if (voicePhase === 'idle') {
      voiceHasSentRef.current = false;
      speechStartRef.current  = null;
      lastSpeechRef.current   = null;
      await startVoiceListening();
      return;
    }

    if (voicePhase === 'listening') {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      voiceHasSentRef.current = true;
      await sendVoiceAudio();
    }

    // thinking / speaking — intentionally do nothing
  };

  return {
    voiceMode,
    voicePhase,
    voiceStatus,
    voiceConnected,
    enterVoiceMode,
    exitVoiceMode,
    handleIndicatorTap,
  };
}