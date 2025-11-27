/**
 * WebSocket client for real-time chat streaming
 * Uses Socket.IO for WebSocket communication with the backend
 */

// Import Socket.IO from CDN
// Note: In production, you might want to bundle this properly
const SOCKET_URL = 'http://localhost:5000';

class ChatWebSocket {
    constructor(url = SOCKET_URL) {
        this.url = url;
        this.socket = null;
        this.connected = false;
    }

    /**
     * Connect to the WebSocket server
     * Must be called after user is authenticated
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Import Socket.IO from CDN
                if (typeof io === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
                    script.onload = () => {
                        this._initSocket(resolve, reject);
                    };
                    script.onerror = () => reject(new Error('Failed to load Socket.IO'));
                    document.head.appendChild(script);
                } else {
                    this._initSocket(resolve, reject);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Initialize Socket.IO connection
     * @private
     */
    _initSocket(resolve, reject) {
        this.socket = io(this.url, {
            withCredentials: true, // Important for session cookies
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.connected = true;
            resolve();
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            reject(error);
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Send a chat message
     * @param {number} chatId - Chat ID
     * @param {string} message - Message text
     */
    sendMessage(chatId, message) {
        if (!this.socket || !this.connected) {
            throw new Error('WebSocket not connected');
        }

        this.socket.emit('send_message', {
            chat_id: chatId,
            message: message
        });
    }

    /**
     * Send a voice message
     * @param {number} chatId - Chat ID
     * @param {string} audioBase64 - Base64 encoded audio
     * @param {string} format - Audio format (webm, wav, etc.)
     */
    sendVoiceMessage(chatId, audioBase64, format) {
        if (!this.socket || !this.connected) {
            throw new Error('WebSocket not connected');
        }

        this.socket.emit('send_voice_message', {
            chat_id: chatId,
            audio: audioBase64,
            format: format
        });
    }

    /**
     * Convert text to speech
     * @param {string} text - Text to convert
     * @param {string} voice - Voice to use (optional)
     * @param {number} speed - Speech speed (optional)
     */
    textToSpeech(text, voice = null, speed = 1.0) {
        if (!this.socket || !this.connected) {
            throw new Error('WebSocket not connected');
        }

        this.socket.emit('text_to_speech', {
            text: text,
            voice: voice,
            speed: speed
        });
    }

    /**
     * Listen for message tokens (streaming chunks)
     * @param {function} callback - Callback function(data)
     */
    onToken(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('message_token', callback);
    }

    /**
     * Listen for message completion
     * @param {function} callback - Callback function(data)
     */
    onComplete(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('message_complete', callback);
    }

    /**
     * Listen for errors
     * @param {function} callback - Callback function(data)
     */
    onError(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('error', callback);
    }

    /**
     * Listen for voice transcription results
     * @param {function} callback - Callback function(data)
     */
    onVoiceTranscribed(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('voice_transcribed', callback);
    }

    /**
     * Listen for voice processing status updates
     * @param {function} callback - Callback function(data)
     */
    onVoiceProcessing(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('voice_processing', callback);
    }

    /**
     * Listen for voice response (audio)
     * @param {function} callback - Callback function(data)
     */
    onVoiceResponse(callback) {
        if (!this.socket) {
            throw new Error('WebSocket not initialized');
        }
        this.socket.on('voice_response', callback);
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        if (this.socket) {
            this.socket.off('message_token');
            this.socket.off('message_complete');
            this.socket.off('error');
            this.socket.off('voice_transcribed');
            this.socket.off('voice_processing');
            this.socket.off('voice_response');
        }
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connected;
    }
}

// Export singleton instance
export const chatSocket = new ChatWebSocket();
