/**
 * WebSocket client
 *
 * NOTE:
 * - Text chat in this project is handled via REST (/api/...) from api.js/dashboard.js.
 * - Voice notes should NOT use Socket.IO against the Flask dev server.
 * - Voice notes should connect directly to the AI voice server (aiohttp) on :8080
 *   Endpoint: ws://localhost:8080/voice-stream?user_id=...&chat_id=...&session_id=...
 *
 * This file keeps the same exported name `chatSocket` to avoid breaking dashboard.js,
 * but internally it only implements VOICE messaging via native WebSocket.
 */

const DEFAULT_VOICE_WS_URL = "ws://localhost:8080/voice-stream";

function makeSessionId() {
  // Modern browsers
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback
  return "sess_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function buildVoiceWsUrl({ userId, chatId, sessionId }) {
  const url = new URL(DEFAULT_VOICE_WS_URL);
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("chat_id", String(chatId));
  url.searchParams.set("session_id", String(sessionId));
  return url.toString();
}

class ChatWebSocket {
  constructor() {
    // Voice WS state
    this.voiceWs = null;
    this.voiceConnected = false;

    // Event callbacks (dashboard can subscribe)
    this._onVoiceTranscribed = null; // (data) => void
    this._onVoiceProcessing = null;  // (data) => void
    this._onVoiceResponse = null;    // (data) => void
    this._onError = null;            // (data) => void
  }

  /**
   * Optional: connect voice WS early.
   * You can also just call sendVoiceMessage(), which will connect automatically.
   */
  connectVoice({ userId, chatId, sessionId = makeSessionId() }) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = buildVoiceWsUrl({ userId, chatId, sessionId });
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          this.voiceWs = ws;
          this.voiceConnected = true;
          resolve({ sessionId });
        };

        ws.onerror = (err) => {
          this.voiceConnected = false;
          reject(err);
        };

        ws.onclose = () => {
          this.voiceConnected = false;
          this.voiceWs = null;
        };

        ws.onmessage = (evt) => {
          this._handleVoiceMessage(evt.data);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect() {
    // Only voice WS exists in this implementation
    if (this.voiceWs) {
      this.voiceWs.close();
      this.voiceWs = null;
      this.voiceConnected = false;
    }
  }

  /**
   * Send a TEXT chat message
   * Not supported here because your text chat uses REST (/api/chat/...)
   */
  sendMessage(chatId, message) {
    throw new Error(
      "sendMessage is not implemented here. Use REST endpoints in api.js for text chat."
    );
  }

  /**
   * Send a VOICE NOTE to the voice server.
   *
   * @param {number|string} chatId
   * @param {string} audioBase64 - base64 audio bytes (NO data: prefix)
   * @param {string} format - "webm" | "wav" | etc.
   * @param {object} opts - { userId, sessionId }
   */
  async sendVoiceMessage(chatId, audioBase64, format, opts = {}) {
    const userId = opts.userId ?? 1; // ✅ default for local demo if not available
    const sessionId = opts.sessionId ?? makeSessionId();

    // Ensure connected
    if (!this.voiceWs || !this.voiceConnected) {
      await this.connectVoice({ userId, chatId, sessionId });
    }

    // Your aiohttp handler expects:
    // { type: "audio_chunk", data: "<base64>", format: "webm", is_final: true }
    const payload = {
      type: "audio_chunk",
      data: audioBase64,
      format: format || "webm",
      is_final: true,
    };

    this.voiceWs.send(JSON.stringify(payload));
    return { sessionId };
  }

  /**
   * Optional control messages (interrupt / set speed)
   */
  sendVoiceControl(command, params = {}) {
    if (!this.voiceWs || !this.voiceConnected) return;
    this.voiceWs.send(
      JSON.stringify({
        type: "control",
        command,
        params,
      })
    );
  }

  /**
   * Incoming messages from voice_server.py:
   * - {type:"status", status:"transcribing|thinking|speaking|..."}
   * - {type:"transcript", role:"user|assistant", text:"...", is_final:true|false}
   * - {type:"audio_chunk", data:"<base64>", format:"mp3", is_final:false}
   * - {type:"error", error:"..."}
   */
  _handleVoiceMessage(raw) {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === "status") {
        if (this._onVoiceProcessing) this._onVoiceProcessing(msg);
        return;
      }

      if (msg.type === "transcript") {
        if (this._onVoiceTranscribed) this._onVoiceTranscribed(msg);
        return;
      }

      if (msg.type === "audio_chunk") {
        if (this._onVoiceResponse) this._onVoiceResponse(msg);
        return;
      }

      if (msg.type === "error") {
        if (this._onError) this._onError(msg);
        return;
      }
    } catch (e) {
      // If message is not JSON, ignore but log for debugging
      console.warn("Voice WS message parse failed:", e, raw);
    }
  }

  // ---- Event subscriptions (keep old names so dashboard.js likely already matches) ----
  onVoiceTranscribed(callback) {
    this._onVoiceTranscribed = callback;
  }

  onVoiceProcessing(callback) {
    this._onVoiceProcessing = callback;
  }

  onVoiceResponse(callback) {
    this._onVoiceResponse = callback;
  }

  onError(callback) {
    this._onError = callback;
  }

  removeAllListeners() {
    this._onVoiceTranscribed = null;
    this._onVoiceProcessing = null;
    this._onVoiceResponse = null;
    this._onError = null;
  }

  isConnected() {
    return this.voiceConnected;
  }
}

// Export singleton instance (same name as before)
export const chatSocket = new ChatWebSocket();