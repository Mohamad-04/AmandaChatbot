// Manages the real-time Socket.IO connection to the Flask backend.
// Used for streaming Amanda's AI responses word-by-word during chat.
//
// Architecture:
//   App  ←─ Socket.IO ─→  Flask  ←─ gRPC ─→  AI Backend

import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../constants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

// Defines the shape of each callback so TypeScript can catch mistakes early
interface SocketCallbacks {
  onConnect:    (() => void)                                    | null;
  onDisconnect: ((reason: string) => void)                      | null;
  onToken:      ((text: string) => void)                        | null;
  onComplete:   ((data: { message_id: number; full_text: string }) => void) | null;
  onError:      ((data: { message: string }) => void)           | null;
}

// ─── Internal state ───────────────────────────────────────────────────────────

let socket: Socket | null = null;

const callbacks: SocketCallbacks = {
  onConnect:    null,
  onDisconnect: null,
  onToken:      null,
  onComplete:   null,
  onError:      null,
};

// ─── Connection ───────────────────────────────────────────────────────────────

// Opens the socket connection to Flask. Safe to call multiple times —
// skips silently if already connected.
function connect(): void {
  if (socket?.connected) return;

  socket = io(BACKEND_URL, {
    withCredentials: true,           // sends Flask session cookie for auth
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 10_000,
  });

  // Fires when socket successfully opens
  socket.on('connect', () => {
    callbacks.onConnect?.();
  });

  // Fires when socket closes for any reason
  socket.on('disconnect', (reason: string) => {
    callbacks.onDisconnect?.(reason);
  });

  // Fires if the socket can't connect at all
  socket.on('connect_error', (err: Error) => {
    callbacks.onError?.({ message: `Connection failed: ${err.message}` });
  });

  // One word/chunk of Amanda's response arriving
  socket.on('message_token', (data: { text: string }) => {
    callbacks.onToken?.(data.text);
  });

  // Amanda finished her full response
  socket.on('message_complete', (data: { message_id: number; full_text: string }) => {
    callbacks.onComplete?.(data);
  });

  // Flask or AI backend sent an error
  socket.on('error', (data: { message: string }) => {
    callbacks.onError?.(data);
  });
}

// Closes the socket and wipes all listeners.
// Call this on logout or when leaving the chat screen.
function disconnect(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// ─── Emit ─────────────────────────────────────────────────────────────────────

// Sends the user's message to Flask over the socket.
// Flask forwards it to the AI backend via gRPC.
function sendMessage(chatId: number, message: string): void {
  if (!socket?.connected) {
    callbacks.onError?.({ message: 'Not connected. Please try again.' });
    return;
  }

  socket.emit('send_message', {
    chat_id: chatId,
    message: message.trim(),
  });
}

// ─── Callback registration ────────────────────────────────────────────────────
// Call these before connect() to register your screen's handlers.
// The chat screen uses these to update UI as tokens arrive.

function onConnect(fn: () => void)                                              { callbacks.onConnect    = fn; }
function onDisconnect(fn: (reason: string) => void)                             { callbacks.onDisconnect = fn; }
function onToken(fn: (text: string) => void)                                    { callbacks.onToken      = fn; }
function onComplete(fn: (data: { message_id: number; full_text: string }) => void) { callbacks.onComplete   = fn; }
function onError(fn: (data: { message: string }) => void)                       { callbacks.onError      = fn; }

// ─── Status ───────────────────────────────────────────────────────────────────

// Returns true if the socket is currently open and healthy
function isConnected(): boolean {
  return socket?.connected === true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const socketService = {
  connect,
  disconnect,
  sendMessage,
  onConnect,
  onDisconnect,
  onToken,
  onComplete,
  onError,
  isConnected,
};

export default socketService;