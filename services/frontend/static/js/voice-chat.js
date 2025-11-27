/**
 * Voice Chat Main Controller
 * Orchestrates VAD, audio streaming, and UI updates for real-time voice chat
 */

class VoiceChatController {
    constructor() {
        // State
        this.currentState = 'idle'; // idle, listening, processing, speaking
        this.isActive = false;
        this.userId = null;
        this.chatId = null;

        // Components
        this.vad = null;
        this.grpcClient = null;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];

        // DOM elements
        this.elements = {
            backBtn: document.getElementById('back-btn'),
            connectionDot: document.getElementById('connection-dot'),
            connectionText: document.getElementById('connection-text'),
            voiceOrb: document.getElementById('voice-orb'),
            soundWave: document.getElementById('sound-wave'),
            statusText: document.getElementById('status-text'),
            statusSubtext: document.getElementById('status-subtext'),
            userTranscript: document.getElementById('user-transcript'),
            userText: document.getElementById('user-text'),
            assistantTranscript: document.getElementById('assistant-transcript'),
            assistantText: document.getElementById('assistant-text'),
            voiceToggleBtn: document.getElementById('voice-toggle-btn'),
            iconMic: document.getElementById('icon-mic'),
            iconStop: document.getElementById('icon-stop'),
            settingsToggle: document.getElementById('settings-toggle'),
            settingsContent: document.getElementById('settings-content'),
            vadThreshold: document.getElementById('vad-threshold'),
            vadValue: document.getElementById('vad-value'),
            silenceDuration: document.getElementById('silence-duration'),
            silenceValue: document.getElementById('silence-value'),
            ttsSpeed: document.getElementById('tts-speed'),
            speedValue: document.getElementById('speed-value'),
            historyToggle: document.getElementById('history-toggle'),
            historySidebar: document.getElementById('history-sidebar'),
            historyClose: document.getElementById('history-close'),
            historyMessages: document.getElementById('history-messages')
        };

        // Conversation history
        this.messages = [];
    }

    /**
     * Initialize voice chat
     */
    async init() {
        try {
            // Get user info from session
            await this.checkAuth();

            // Initialize gRPC client
            this.grpcClient = new GRPCVoiceClient('ws://localhost:8080');

            // Setup gRPC callbacks
            this.setupGRPCCallbacks();

            // Setup event listeners
            this.setupEventListeners();

            // Update UI
            this.updateConnectionStatus('connecting');

            // Connect to voice service
            await this.grpcClient.connect(this.userId, this.chatId);

            console.log('Voice chat initialized');

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize voice chat');
        }
    }

    /**
     * Check authentication
     */
    async checkAuth() {
        // TODO: Implement auth check with your API
        // For now, use dummy values or get from session storage
        this.userId = sessionStorage.getItem('user_id') || 'user_1';
        this.chatId = sessionStorage.getItem('current_chat_id') || 'chat_1';

        console.log(`User: ${this.userId}, Chat: ${this.chatId}`);
    }

    /**
     * Setup gRPC client callbacks
     */
    setupGRPCCallbacks() {
        this.grpcClient.onConnected = () => {
            console.log('Connected to voice service');
            this.updateConnectionStatus('connected');
            this.elements.voiceToggleBtn.disabled = false;
        };

        this.grpcClient.onDisconnected = () => {
            console.log('Disconnected from voice service');
            this.updateConnectionStatus('disconnected');
            this.elements.voiceToggleBtn.disabled = true;
            this.stopSession();
        };

        this.grpcClient.onTranscriptUpdate = (data) => {
            this.handleTranscriptUpdate(data);
        };

        this.grpcClient.onAudioChunk = (data) => {
            // Audio playback is handled automatically by the client
            // Update UI to show speaking state
            this.setState('speaking');
        };

        this.grpcClient.onStatusUpdate = (status) => {
            this.handleStatusUpdate(status);
        };

        this.grpcClient.onError = (error) => {
            console.error('gRPC error:', error);
            this.showError(error.message || 'Voice service error');
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Back button
        this.elements.backBtn.addEventListener('click', () => {
            window.location.href = '/dashboard/';
        });

        // Voice toggle button
        this.elements.voiceToggleBtn.addEventListener('click', () => {
            this.toggleVoiceSession();
        });

        // Settings toggle
        this.elements.settingsToggle.addEventListener('click', () => {
            const isVisible = this.elements.settingsContent.style.display === 'block';
            this.elements.settingsContent.style.display = isVisible ? 'none' : 'block';
        });

        // VAD threshold slider
        this.elements.vadThreshold.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.vadValue.textContent = value.toFixed(2);

            if (this.vad) {
                this.vad.setThreshold(value);
            }
        });

        // Silence duration slider
        this.elements.silenceDuration.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.silenceValue.textContent = `${value}ms`;

            if (this.vad) {
                this.vad.setSilenceDuration(value);
            }
        });

        // TTS speed slider
        this.elements.ttsSpeed.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.elements.speedValue.textContent = `${value.toFixed(1)}x`;

            // Send to server
            if (this.grpcClient && this.grpcClient.isConnected()) {
                this.grpcClient.sendControl('set_tts_speed', { speed: value });
            }
        });

        // History toggle
        this.elements.historyToggle.addEventListener('click', () => {
            this.elements.historySidebar.classList.add('open');
        });

        this.elements.historyClose.addEventListener('click', () => {
            this.elements.historySidebar.classList.remove('open');
        });
    }

    /**
     * Toggle voice session on/off
     */
    async toggleVoiceSession() {
        if (this.isActive) {
            await this.stopSession();
        } else {
            await this.startSession();
        }
    }

    /**
     * Start voice session
     */
    async startSession() {
        try {
            // Request microphone access
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            // Initialize VAD
            this.vad = new VADDetector();
            await this.vad.initialize(this.audioStream);

            // Setup VAD callbacks
            this.vad.onSpeechStart = () => {
                console.log('User started speaking');
                this.setState('listening');
                this.startRecording();
            };

            this.vad.onSpeechEnd = (duration) => {
                console.log(`User stopped speaking (${duration}ms)`);
                this.setState('processing');
                this.stopRecording();
            };

            this.vad.onVolumeChange = (volume) => {
                this.updateVolumeVisualization(volume);
            };

            // Apply current VAD settings
            this.vad.setThreshold(parseFloat(this.elements.vadThreshold.value));
            this.vad.setSilenceDuration(parseInt(this.elements.silenceDuration.value));

            // Start VAD monitoring
            this.vad.startMonitoring();

            // Update state
            this.isActive = true;
            this.setState('listening');

            // Update UI
            this.elements.iconMic.style.display = 'none';
            this.elements.iconStop.style.display = 'block';
            this.elements.voiceToggleBtn.classList.add('active');

            console.log('Voice session started');

        } catch (error) {
            console.error('Failed to start session:', error);
            this.showError('Microphone access denied or unavailable');
        }
    }

    /**
     * Stop voice session
     */
    async stopSession() {
        // Stop VAD
        if (this.vad) {
            this.vad.stopMonitoring();
            this.vad.cleanup();
            this.vad = null;
        }

        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop audio stream
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        // Update state
        this.isActive = false;
        this.setState('idle');

        // Update UI
        this.elements.iconMic.style.display = 'block';
        this.elements.iconStop.style.display = 'none';
        this.elements.voiceToggleBtn.classList.remove('active');

        console.log('Voice session stopped');
    }

    /**
     * Start recording audio
     */
    startRecording() {
        this.audioChunks = [];

        // Create MediaRecorder
        const mimeType = this.getSupportedMimeType();
        this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });

        // Handle data available - STREAM CHUNKS IN REAL-TIME
        this.mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);

                // Stream chunk immediately (for future low-latency implementation)
                // For now, just accumulate - true streaming would send here
                console.log(`Recorded chunk: ${event.data.size} bytes`);
            }
        };

        this.mediaRecorder.onstop = async () => {
            await this.sendAudioToServer();
        };

        // Start recording with small chunks (250ms for responsive streaming)
        this.mediaRecorder.start(250); // 250ms chunks
    }

    /**
     * Stop recording audio
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    /**
     * Send recorded audio to server
     */
    async sendAudioToServer() {
        if (this.audioChunks.length === 0) {
            console.warn('No audio data to send');
            return;
        }

        try {
            // Combine chunks into single blob
            const mimeType = this.getSupportedMimeType();
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });

            // Convert to base64
            const base64Audio = await this.blobToBase64(audioBlob);

            // Get format
            const format = this.getFormatFromMimeType(mimeType);

            // Send to server
            this.grpcClient.sendAudioChunk(base64Audio, format, true);

            console.log(`Sent ${audioBlob.size} bytes of audio`);

        } catch (error) {
            console.error('Error sending audio:', error);
            this.showError('Failed to send audio');
        }
    }

    /**
     * Handle transcript update from server
     */
    handleTranscriptUpdate(data) {
        const { text, role, isFinal } = data;

        if (role === 'user') {
            this.elements.userText.textContent = text;
            this.elements.userTranscript.classList.add('visible');

            if (isFinal) {
                this.addToHistory('user', text);
            }
        } else if (role === 'assistant') {
            this.elements.assistantText.textContent = text;
            this.elements.assistantTranscript.classList.add('visible');

            if (isFinal) {
                this.addToHistory('assistant', text);
                this.setState('idle');
            }
        }
    }

    /**
     * Handle status update from server
     */
    handleStatusUpdate(status) {
        const statusMessages = {
            'transcribing': 'Transcribing your speech...',
            'processing': 'Processing your request...',
            'thinking': 'Amanda is thinking...',
            'synthesizing': 'Generating voice response...',
            'speaking': 'Amanda is speaking...'
        };

        if (statusMessages[status]) {
            this.elements.statusSubtext.textContent = statusMessages[status];
        }

        // Update state based on status
        if (status === 'processing' || status === 'thinking' || status === 'synthesizing') {
            this.setState('processing');
        } else if (status === 'speaking') {
            this.setState('speaking');
        }
    }

    /**
     * Set current state and update UI
     */
    setState(state) {
        this.currentState = state;

        // Update orb class
        this.elements.voiceOrb.className = `voice-orb ${state}`;

        // Update status text
        const statusTexts = {
            'idle': 'Ready to listen',
            'listening': 'Listening...',
            'processing': 'Processing...',
            'speaking': 'Speaking...'
        };

        this.elements.statusText.textContent = statusTexts[state] || 'Voice Chat';
    }

    /**
     * Update volume visualization
     */
    updateVolumeVisualization(volume) {
        // Update sound wave bars based on volume
        const bars = this.elements.soundWave.querySelectorAll('.wave-bar');
        bars.forEach((bar, index) => {
            const height = Math.max(10, volume * 35 * (1 + index * 0.2));
            bar.style.height = `${height}px`;
        });
    }

    /**
     * Update connection status UI
     */
    updateConnectionStatus(status) {
        this.elements.connectionDot.className = `status-dot ${status}`;

        const statusTexts = {
            'disconnected': 'Disconnected',
            'connecting': 'Connecting...',
            'connected': 'Connected'
        };

        this.elements.connectionText.textContent = statusTexts[status] || 'Unknown';
    }

    /**
     * Add message to conversation history
     */
    addToHistory(role, text) {
        const message = {
            role,
            text,
            timestamp: new Date()
        };

        this.messages.push(message);

        // Add to history sidebar
        const messageEl = document.createElement('div');
        messageEl.className = `history-message ${role}`;

        messageEl.innerHTML = `
            <div class="history-message-role">${role === 'user' ? 'You' : 'Amanda'}</div>
            <div class="history-message-text">${text}</div>
            <div class="history-message-time">${this.formatTime(message.timestamp)}</div>
        `;

        this.elements.historyMessages.appendChild(messageEl);

        // Scroll to bottom
        this.elements.historyMessages.scrollTop = this.elements.historyMessages.scrollHeight;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.statusText.textContent = 'Error';
        this.elements.statusSubtext.textContent = message;
        this.elements.statusSubtext.style.color = '#ff4444';

        setTimeout(() => {
            this.elements.statusSubtext.style.color = '';
            if (this.isActive) {
                this.setState(this.currentState);
            }
        }, 3000);
    }

    /**
     * Get supported MIME type for recording
     */
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return '';
    }

    /**
     * Get format from MIME type
     */
    getFormatFromMimeType(mimeType) {
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('wav')) return 'wav';
        return 'webm';
    }

    /**
     * Convert Blob to base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Format timestamp
     */
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize voice chat on page load
const voiceChat = new VoiceChatController();
voiceChat.init();
