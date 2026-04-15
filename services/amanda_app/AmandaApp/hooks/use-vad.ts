// Voice Activity Detection — monitors mic metering and fires
// onSpeechEnd() after silence. Min 500ms speech before triggering.

import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

const VAD_THRESHOLD    = 0.15;
const SILENCE_DURATION = 1500;
const MIN_SPEECH_MS    = 500;

interface VADOptions {
  onSpeechEnd: () => void;
}

export function useVAD({ onSpeechEnd }: VADOptions) {
  const recordingRef      = useRef<Audio.Recording | null>(null);
  const silenceTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartRef    = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number | null>(null);
  const hasSentRef        = useRef(false);

  const start = useCallback(async () => {
    if (recordingRef.current) return;

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS:   true,
      playsInSilentModeIOS: true,
    });

    // Reset state
    hasSentRef.current        = false;
    speechStartRef.current    = null;
    lastSpeechTimeRef.current = null;

    const { recording } = await Audio.Recording.createAsync(
      {
        android: {
          extension: '.wav', outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000, numberOfChannels: 1, bitRate: 128000,
        },
        ios: {
          extension: '.wav', audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000, numberOfChannels: 1, bitRate: 128000,
          linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false,
        },
        web: {},
      },
      (status) => {
        if (!status.isRecording) return;
        const level     = (status as any).metering ?? -60;
        const amplitude = Math.max(0, (level + 60) / 60);
        const now       = Date.now();

        if (amplitude > VAD_THRESHOLD) {
          lastSpeechTimeRef.current = now;
          if (!speechStartRef.current) {
            speechStartRef.current = now;
          }
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
        } else {
          const speechDuration = speechStartRef.current
            ? now - speechStartRef.current : 0;

          if (
            lastSpeechTimeRef.current &&
            speechDuration >= MIN_SPEECH_MS &&
            !silenceTimer.current &&
            !hasSentRef.current
          ) {
            silenceTimer.current = setTimeout(() => {
              silenceTimer.current      = null;
              speechStartRef.current    = null;
              lastSpeechTimeRef.current = null;
              hasSentRef.current        = true;
              onSpeechEnd();
            }, SILENCE_DURATION);
          }
        }
      },
      100
    );

    recordingRef.current = recording;
  }, [onSpeechEnd]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    if (!recordingRef.current) return null;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      return uri ?? null;
    } catch {
      recordingRef.current = null;
      return null;
    }
  }, []);

  const cancel = useCallback(async () => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    await recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current      = null;
    speechStartRef.current    = null;
    lastSpeechTimeRef.current = null;
    hasSentRef.current        = false;
  }, []);

  const isRecording = useCallback(() => !!recordingRef.current, []);

  return { start, stop, cancel, isRecording };
}