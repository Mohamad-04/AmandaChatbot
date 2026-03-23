/**
 * socket.service.js
 * ─────────────────────────────────────────────────────────────
 * Manages the Socket.IO connection between the React Native app
 * and the Flask backend (chat_handler.py / voice_handler.py).
 *
 * Architecture reminder:
 *   React Native App  ←─ Socket.IO ─→  Flask  ←─ gRPC ─→  AI Backend
 *
 */

import { io } from 'socket.io-client';

// Change later to IP of local machine 
import { FLASK_BASE_URL } from './config'; 





// ─── Internal state ───────────────────────────────────────────────────────────

let socket = null;

// Registered app-level callbacks (set via the on* methods below)
const callbacks = {
  onConnect:    null,   // ()           → socket opened
  onDisconnect: null,   // (reason)     → socket closed
  onToken:      null,   // (text)       → one streaming word arrived
  onComplete:   null,   // ({message_id, full_text}) → stream finished
  onError:      null,   // ({message})  → server sent an error event
};

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Open a Socket.IO connection to the Flask backend.
 * Safe to call multiple times — will skip if already connected.
 *
 * Flask expects the session cookie for auth (withCredentials: true).
 */
function connect() {
  if (socket?.connected) return;

  socket = io(FLASK_BASE_URL, {
    withCredentials: true,       // send the Flask session cookie
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
    timeout: 10_000,
  });

  // ── Core lifecycle events ──────────────────────────────────
  socket.on('connect', () => {
    console.log('[Socket] Connected ✓', socket.id);
    callbacks.onConnect?.();
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    callbacks.onDisconnect?.(reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
    // Treat as an error the UI can react to
    callbacks.onError?.({ message: `Connection failed: ${err.message}` });
  });

  // ── Amanda streaming events ────────────────────────────────
  //
  // 'message_token'    { text: string }
  //   → fired for every word/chunk while Amanda is typing
  //
  // 'message_complete' { message_id: int, full_text: string }
  //   → fired once when the full response is done
  //
  // 'error'            { message: string }
  //   → fired if something goes wrong on the Flask/AI side

  socket.on('message_token', (data) => {
    callbacks.onToken?.(data.text);
  });

  socket.on('message_complete', (data) => {
    callbacks.onComplete?.(data);
  });

  socket.on('error', (data) => {
    console.error('[Socket] Server error:', data.message);
    callbacks.onError?.(data);
  });
}

/**
 * Close the socket and clean up all listeners.
 * Call this on logout or when leaving the chat screen.
 */
function disconnect() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleaned up.');
  }
}

// ─── Emit ─────────────────────────────────────────────────────────────────────

/**
 * Send a user message to Flask, which forwards it to the AI backend.
 *
 * Flask handler: websocket/chat_handler.py → handle_send_message
 * Event name:    'send_message'
 * Payload:       { chat_id: number, message: string }
 *
 * @param {number} chatId   - The active chat's ID
 * @param {string} message  - The user's message text
 */
function sendMessage(chatId, message) {
  if (!socket?.connected) {
    console.warn('[Socket] sendMessage called but socket is not connected.');
    callbacks.onError?.({ message: 'Not connected. Please try again.' });
    return;
  }

  socket.emit('send_message', {
    chat_id: chatId,
    message: message.trim(),
  });
}

// ─── Callback registration ────────────────────────────────────────────────────
//
// These let the Chat screen register handlers without needing a direct
// reference to the socket. Call them before connect() or any time after.

/** Called when the socket successfully opens. */
function onConnect(fn)    { callbacks.onConnect    = fn; }

/** Called when the socket closes (fn receives the disconnect reason). */
function onDisconnect(fn) { callbacks.onDisconnect = fn; }

/** Called for each streaming token. fn(text: string) */
function onToken(fn)      { callbacks.onToken      = fn; }

/** Called when Amanda finishes her response. fn({ message_id, full_text }) */
function onComplete(fn)   { callbacks.onComplete   = fn; }

/** Called on any socket-level or server-side error. fn({ message }) */
function onError(fn)      { callbacks.onError      = fn; }

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Returns true if the socket is currently open. */
function isConnected() {
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