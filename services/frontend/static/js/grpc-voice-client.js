/**
 * gRPC-Web Voice Client
 * Handles bidirectional streaming for real-time voice chat
 * Uses WebSocket-based approach for bidirectional communication
 */

class GRPCVoiceClient {
    constructor(url = 'ws://localhost:8080') {
        this.url = url;
        this.websocket = null;
        this.connected = false;
        this.sessionId = null;

        // Callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onTranscriptUpdate = null;
        this.onAudioChunk = null;
        this.onError = null;
        this.onStatusUpdate = null;

        // Audio queue for playback
        this.audioQueue = [];
        this.isPlaying = false;
    }

    /**
     * Connect to gRPC voice service
     */
    async connect(userId, chatId) {
        return new Promise((resolve, reject) => {
            try {
                // Generate session ID
                this.sessionId = this.generateSessionId();

                // Create WebSocket connection
                const wsUrl = `${this.url}/voice-stream?user_id=${userId}&chat_id=${chatId}&session_id=${this.sessionId}`;
                this.websocket = new WebSocket(wsUrl);

                // Handle connection open
                this.websocket.onopen = () => {
                    console.log('gRPC Voice Client connected');
                    this.connected = true;

                    if (this.onConnected) {
                        this.onConnected();
                    }

                    resolve();
                };

                // Handle incoming messages
                this.websocket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                // Handle errors
                this.websocket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.connected = false;

                    if (this.onError) {
                        this.onError(error);
                    }

                    reject(error);
                };

                // Handle connection close
                this.websocket.onclose = () => {
                    console.log('gRPC Voice Client disconnected');
                    this.connected = false;

                    if (this.onDisconnected) {
                        this.onDisconnected();
                    }
                };

            } catch (error) {
                console.error('Connection error:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from service
     */
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        this.connected = false;
        this.sessionId = null;
    }

    /**
     * Send audio chunk to server
     */
    sendAudioChunk(audioData, format = 'webm', isFinal = false) {
        if (!this.connected || !this.websocket) {
            console.error('Not connected to voice service');
            return;
        }

        const message = {
            type: 'audio_chunk',
            session_id: this.sessionId,
            data: audioData,
            format: format,
            is_final: isFinal,
            timestamp: Date.now()
        };

        this.websocket.send(JSON.stringify(message));
    }

    /**
     * Send control message
     */
    sendControl(command, params = {}) {
        if (!this.connected || !this.websocket) {
            console.error('Not connected to voice service');
            return;
        }

        const message = {
            type: 'control',
            session_id: this.sessionId,
            command: command,
            params: params,
            timestamp: Date.now()
        };

        this.websocket.send(JSON.stringify(message));
    }

    /**
     * Handle incoming message from server
     */
    async handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'transcript':
                    // Transcript update (partial or final)
                    if (this.onTranscriptUpdate) {
                        this.onTranscriptUpdate({
                            text: message.text,
                            role: message.role,
                            isFinal: message.is_final
                        });
                    }
                    break;

                case 'audio_chunk':
                    // Audio chunk from TTS
                    if (this.onAudioChunk) {
                        this.onAudioChunk({
                            audio: message.data,
                            format: message.format,
                            isFinal: message.is_final
                        });
                    }

                    // Add to queue for playback
                    this.queueAudio(message.data, message.format);
                    break;

                case 'status':
                    // Status update (processing, thinking, etc.)
                    if (this.onStatusUpdate) {
                        this.onStatusUpdate(message.status);
                    }
                    break;

                case 'error':
                    // Error from server
                    console.error('Server error:', message.error);
                    if (this.onError) {
                        this.onError(new Error(message.error));
                    }
                    break;

                default:
                    console.warn('Unknown message type:', message.type);
            }

        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    /**
     * Queue audio chunk for playback
     */
    queueAudio(base64Audio, format) {
        this.audioQueue.push({ audio: base64Audio, format: format });

        // Start playback if not already playing
        if (!this.isPlaying) {
            this.playNextAudio();
        }
    }

    /**
     * Play next audio chunk in queue
     */
    async playNextAudio() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const { audio, format } = this.audioQueue.shift();

        try {
            // Convert base64 to blob
            const audioBlob = this.base64ToBlob(audio, format);
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and play audio
            const audioElement = new Audio(audioUrl);

            audioElement.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.playNextAudio(); // Play next chunk
            };

            audioElement.onerror = (error) => {
                console.error('Audio playback error:', error);
                URL.revokeObjectURL(audioUrl);
                this.playNextAudio(); // Try next chunk
            };

            await audioElement.play();

        } catch (error) {
            console.error('Error playing audio chunk:', error);
            this.playNextAudio(); // Try next chunk
        }
    }

    /**
     * Clear audio queue
     */
    clearAudioQueue() {
        this.audioQueue = [];
        this.isPlaying = false;
    }

    /**
     * Convert base64 to Blob
     */
    base64ToBlob(base64, format) {
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'webm': 'audio/webm',
            'opus': 'audio/opus'
        };

        const mimeType = mimeTypes[format] || 'audio/mpeg';
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}
