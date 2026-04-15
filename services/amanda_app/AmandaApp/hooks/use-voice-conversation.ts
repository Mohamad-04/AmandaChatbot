// hooks/useVoiceConversation.ts

import { useState, useRef, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useVAD } from './use-vad';
import { useVoiceWS, VoiceWSMessage } from './use-voice-ws';
import { useAudioQueue } from './use-audio-queue';

type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useVoiceConversation({
  onTranscript,
}: {
  onTranscript: (role: 'user' | 'assistant', text: string) => void;
}) {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [status, setStatus] = useState('Tap to speak');

  const currentUriRef = useRef<string | null>(null);

  // ─── TTS QUEUE ─────────────────────────────
  const { queueChunk, stop: stopAudio, isPlaying } = useAudioQueue(() => {
    setPhase('idle');
    setStatus('Tap to speak');
  });

  // ─── WS ────────────────────────────────────
  const { connect, sendAudio, disconnect } = useVoiceWS({
    onConnect: () => {},
    onDisconnect: () => {
      setPhase('idle');
      setStatus('Disconnected');
    },
    onMessage: (msg: VoiceWSMessage) => {
      switch (msg.type) {
        case 'status':
          if (['thinking', 'processing'].includes(msg.status)) {
            setPhase('thinking');
            setStatus('Thinking...');
          }
          if (['speaking'].includes(msg.status)) {
            setPhase('speaking');
            setStatus('Speaking...');
          }
          break;

        case 'transcript':
          if (msg.is_final && msg.text?.trim()) {
            onTranscript(
              msg.role === 'user' ? 'user' : 'assistant',
              msg.text.trim()
            );
          }
          break;

        case 'audio_chunk':
          queueChunk(msg.data, msg.format || 'mp3');
          break;

        case 'error':
          setPhase('idle');
          setStatus('Error occurred');
          break;
      }
    },
  });

  // ─── VAD ───────────────────────────────────
  const { start, stop, cancel } = useVAD({
    onSpeechEnd: async () => {
      if (!currentUriRef.current) return;

      setPhase('thinking');
      setStatus('Thinking...');

      const base64 = await FileSystem.readAsStringAsync(
        currentUriRef.current,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      sendAudio(base64);
    },
  });

  // ─── START LISTENING ───────────────────────
  const startListening = useCallback(async () => {
    setPhase('listening');
    setStatus('Listening...');
    connect();

    await start();
  }, [start, connect]);

  // ─── STOP + SEND ───────────────────────────
  const stopAndSend = useCallback(async () => {
    const uri = await stop();
    if (!uri) return;

    currentUriRef.current = uri;

    setPhase('thinking');
    setStatus('Thinking...');

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    sendAudio(base64);
  }, [stop, sendAudio]);

  // ─── FULL RESET ────────────────────────────
  const reset = useCallback(() => {
    cancel();
    disconnect();
    stopAudio();
    setPhase('idle');
    setStatus('Tap to speak');
  }, [cancel, disconnect, stopAudio]);

  return {
    phase,
    status,
    isPlaying,

    startListening,
    stopAndSend,
    reset,
  };
}