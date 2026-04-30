// Manages sequential TTS audio chunk playback.
// Exposes queueChunk(), stop(), and state: isPlaying.

import { useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export function useAudioQueue(onQueueEmpty: () => void) {
  const queueRef      = useRef<Array<{ data: string; format: string }>>([]);
  const isPlayingRef  = useRef(false);
  const soundRef      = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playNext = useCallback(async () => {
    if (isPlayingRef.current) return;

    if (queueRef.current.length === 0) {
      setIsPlaying(false);
      onQueueEmpty();
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    const { data: base64, format } = queueRef.current.shift()!;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         false,
        playsInSilentModeIOS:       true,
        staysActiveInBackground:    false,
        shouldDuckAndroid:          true,
        playThroughEarpieceAndroid: false,
      });

      const uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.${format}`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: 1.0 }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          isPlayingRef.current = false;
          await sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
          playNext();
        }
        if (!status.isLoaded && status.error) {
          isPlayingRef.current = false;
          playNext();
        }
      });

      await sound.playAsync();

    } catch (e) {
      console.log('[AudioQueue] error:', e);
      isPlayingRef.current = false;
      setIsPlaying(false);
      playNext();
    }
  }, [onQueueEmpty]);

  const queueChunk = useCallback((data: string, format: string) => {
    queueRef.current.push({ data, format });
    playNext();
  }, [playNext]);

  const stop = useCallback(async () => {
    queueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    // Restore recording mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:   true,
      playsInSilentModeIOS: true,
    });
  }, []);

  return { queueChunk, stop, isPlaying };
}