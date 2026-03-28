// WebSocket connection to the voice server.
// Handles connect/reconnect, sending audio, and dispatching messages.

import { useRef, useCallback } from 'react';
import { FLASK_BASE } from '../constants/api';

const VOICE_SERVER = FLASK_BASE.replace(':5000', ':8080');

export type VoiceWSMessage =
  | { type: 'status';     status: string }
  | { type: 'transcript'; role: string; text: string; is_final: boolean }
  | { type: 'audio_chunk'; data: string; format: string }
  | { type: 'error';      error: string };

interface Options {
  onMessage:    (msg: VoiceWSMessage) => void;
  onConnect:    () => void;
  onDisconnect: () => void;
}

export function useVoiceWS({ onMessage, onConnect, onDisconnect }: Options) {
  const wsRef           = useRef<WebSocket | null>(null);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
       wsRef.current.readyState === WebSocket.CONNECTING)
    ) return;

    const url = `ws://${VOICE_SERVER.replace(/^https?:\/\//, '')}/voice-stream`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'start', user_id: 'app_user',
        chat_id: `voice_${Date.now()}`, session_id: `vs_${Date.now()}`,
      }));
      onConnect();
    };

    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); }
      catch {}
    };

    ws.onclose = () => {
      onDisconnect();
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => onDisconnect();
  }, [onMessage, onConnect, onDisconnect]);

  const sendAudio = useCallback((base64: string) => {
    wsRef.current?.send(JSON.stringify({
      type: 'audio_chunk', data: base64, format: 'wav', is_final: true,
    }));
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, sendAudio, disconnect };
}