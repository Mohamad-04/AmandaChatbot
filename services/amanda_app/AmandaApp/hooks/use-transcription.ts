// Handles voice-to-text transcription via the mic button in the chat input bar.
// Records audio, sends it to the voice server, and returns the transcript
// as text into the input box — the user can then edit it before sending.
// This is separate from full voice conversation mode (use-voice-chat.ts).

import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { VOICE_SERVER_URL } from '../constants/config';

// All state and actions the chat screen needs for transcription
interface UseTranscriptionReturn {
  isTranscribing: boolean;
  isRecording:    boolean;
  isActive:       boolean;
  startRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  confirmRecording: (onTranscript: (text: string) => void) => Promise<void>;
}

export function useTranscription(): UseTranscriptionReturn {
  const [isActive,       setIsActive]       = useState(false);
  const [isRecording,    setIsRecording]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Holds the active recording and WebSocket instances between function calls
  const recordingRef = useRef<Audio.Recording | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);

  // ── Audio recording config ─────────────────────────────────────────────
  // 16kHz mono WAV — required format for the transcription server
  const RECORDING_OPTIONS = {
    android: {
      extension:     '.wav',
      outputFormat:  Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder:  Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate:    16000,
      numberOfChannels: 1,
      bitRate:       128000,
    },
    ios: {
      extension:           '.wav',
      audioQuality:        Audio.IOSAudioQuality.HIGH,
      sampleRate:          16000,
      numberOfChannels:    1,
      bitRate:             128000,
      linearPCMBitDepth:   16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat:    false,
    },
    web: {},
  };

  // ── Start recording ────────────────────────────────────────────────────
  // Requests mic permission then begins capturing audio
  const startRecording = async (): Promise<void> => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:   true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsActive(true);
      setIsRecording(true);
    } catch (e) {
      console.log('[Transcription] startRecording error:', e);
    }
  };

  // ── Cancel recording ───────────────────────────────────────────────────
  // Discards the recording and resets all state — no transcript produced
  const cancelRecording = async (): Promise<void> => {
    await recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setIsActive(false);
    setIsRecording(false);
    setIsTranscribing(false);
  };

  // ── Confirm recording ──────────────────────────────────────────────────
  // Stops recording, sends audio to voice server, calls onTranscript with result
  // onTranscript is provided by the screen to put the text into the input box
  const confirmRecording = async (onTranscript: (text: string) => void): Promise<void> => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) { await cancelRecording(); return; }

      // Read audio file as base64 to send over WebSocket
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const ws     = new WebSocket(`ws://${VOICE_SERVER_URL.replace('http://', '')}/voice-stream`);
      wsRef.current = ws;

      let transcriptSent = false;

      // Initiate the transcription session
      ws.onopen = () => ws.send(JSON.stringify({
        type:       'start',
        user_id:    'app_user',
        chat_id:    `chat_${Date.now()}`,
        session_id: `transcription_${Date.now()}`,
      }));

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        // Server ready — send the audio
        if (data.type === 'started') {
          ws.send(JSON.stringify({
            type:     'audio_chunk',
            data:     base64,
            format:   'wav',
            is_final: true,
          }));
        }

        // Transcript received — pass to screen and clean up
        if ((data.type === 'transcription' || data.type === 'transcript') && data.is_final !== false) {
          if (transcriptSent) return;
          transcriptSent = true;
          ws.onmessage = null;
          ws.close();

          const text = (data.text || data.transcript || '').trim();
          setIsActive(false);
          setIsTranscribing(false);
          if (text) onTranscript(text);
        }

        // Server error — reset quietly
        if (data.type === 'error') {
          if (transcriptSent) return;
          transcriptSent = true;
          ws.onmessage = null;
          ws.close();
          setIsActive(false);
          setIsTranscribing(false);
        }
      };

      ws.onerror = () => {
        if (!transcriptSent) {
          transcriptSent = true;
          setIsActive(false);
          setIsTranscribing(false);
        }
      };

    } catch (e) {
      console.log('[Transcription] confirmRecording error:', e);
      await cancelRecording();
    }
  };

  return {
    isActive,
    isRecording,
    isTranscribing,
    startRecording,
    cancelRecording,
    confirmRecording,
  };
}