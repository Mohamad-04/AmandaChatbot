/**
 * Voice Activity Detection (VAD)
 * Detects when user is speaking vs silent to automatically manage turn-taking
 */

class VADDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isMonitoring = false;
        this.isSpeaking = false;

        // VAD parameters
        this.threshold = 0.15; // Energy threshold for speech detection (0.0-1.0, default 0.15)
        this.silenceDuration = 1500; // ms of silence before considering speech ended
        this.minSpeechDuration = 500; // ms minimum speech duration to be considered valid

        // Debug
        this.debugMode = true; // Set to true to see VAD logs

        // Timing
        this.speechStartTime = null;
        this.lastSpeechTime = null;
        this.silenceCheckInterval = null;

        // Callbacks
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onVolumeChange = null;
    }

    /**
     * Initialize VAD with microphone stream
     */
    async initialize(stream) {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            // Create data array for frequency analysis
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            console.log('VAD initialized successfully');
            return true;
        } catch (error) {
            console.error('VAD initialization error:', error);
            throw error;
        }
    }

    /**
     * Start monitoring for voice activity
     */
    startMonitoring() {
        if (!this.analyser) {
            console.error('VAD not initialized');
            return;
        }

        this.isMonitoring = true;
        this.isSpeaking = false;
        this.speechStartTime = null;
        this.lastSpeechTime = null;

        // Start monitoring loop
        this.monitorLoop();

        // Start silence check interval
        this.silenceCheckInterval = setInterval(() => {
            this.checkForSilence();
        }, 100);

        console.log('VAD monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;

        if (this.silenceCheckInterval) {
            clearInterval(this.silenceCheckInterval);
            this.silenceCheckInterval = null;
        }

        if (this.isSpeaking) {
            this.handleSpeechEnd();
        }

        console.log('VAD monitoring stopped');
    }

    /**
     * Main monitoring loop
     */
    monitorLoop() {
        if (!this.isMonitoring) return;

        // Get current audio data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate RMS (Root Mean Square) energy
        const energy = this.calculateEnergy();

        // Normalize energy (0-1)
        const normalizedEnergy = energy / 255;

        // Call volume change callback
        if (this.onVolumeChange) {
            this.onVolumeChange(normalizedEnergy);
        }

        // Check if energy exceeds threshold
        if (normalizedEnergy > this.threshold) {
            this.lastSpeechTime = Date.now();

            // If not already speaking, start speech
            if (!this.isSpeaking) {
                this.handleSpeechStart();
            }
        }

        // Debug logging (every second)
        if (this.debugMode && Math.random() < 0.02) {
            console.log(`VAD: energy=${normalizedEnergy.toFixed(3)}, threshold=${this.threshold.toFixed(3)}, speaking=${this.isSpeaking}`);
        }

        // Continue monitoring
        requestAnimationFrame(() => this.monitorLoop());
    }

    /**
     * Calculate energy from frequency data
     * Uses RMS (Root Mean Square) for better detection
     */
    calculateEnergy() {
        let sum = 0;

        // Focus on speech frequencies (roughly 85Hz to 3000Hz)
        // With fftSize=2048 and sample rate 16000, each bin is ~7.8Hz
        // So bins 11 to 385 cover speech range
        const startBin = 11;
        const endBin = Math.min(385, this.dataArray.length);

        for (let i = startBin; i < endBin; i++) {
            // RMS: square each value
            sum += (this.dataArray[i] / 255) * (this.dataArray[i] / 255);
        }

        // Take mean and square root
        const rms = Math.sqrt(sum / (endBin - startBin));

        // Return value between 0-255 for consistency
        return rms * 255;
    }

    /**
     * Check for silence (no speech for specified duration)
     */
    checkForSilence() {
        if (!this.isSpeaking) return;

        const now = Date.now();
        const timeSinceLastSpeech = now - this.lastSpeechTime;

        // If silence duration exceeded, end speech
        if (timeSinceLastSpeech >= this.silenceDuration) {
            // Check if speech duration was long enough
            const speechDuration = this.lastSpeechTime - this.speechStartTime;

            if (speechDuration >= this.minSpeechDuration) {
                this.handleSpeechEnd();
            } else {
                // Speech was too short, ignore it
                this.isSpeaking = false;
                this.speechStartTime = null;
            }
        }
    }

    /**
     * Handle speech start event
     */
    handleSpeechStart() {
        this.isSpeaking = true;
        this.speechStartTime = Date.now();
        this.lastSpeechTime = Date.now();

        console.log('🎤 VAD: Speech STARTED');

        if (this.onSpeechStart) {
            this.onSpeechStart();
        }
    }

    /**
     * Handle speech end event
     */
    handleSpeechEnd() {
        const speechDuration = this.lastSpeechTime - this.speechStartTime;

        console.log(`🛑 VAD: Speech ENDED (duration: ${speechDuration}ms)`);

        this.isSpeaking = false;
        this.speechStartTime = null;

        if (this.onSpeechEnd) {
            this.onSpeechEnd(speechDuration);
        }
    }

    /**
     * Set VAD threshold (0-1)
     */
    setThreshold(threshold) {
        this.threshold = Math.max(0, Math.min(1, threshold));
        console.log(`VAD threshold set to: ${this.threshold}`);
    }

    /**
     * Set silence duration (ms)
     */
    setSilenceDuration(duration) {
        this.silenceDuration = Math.max(100, duration);
        console.log(`Silence duration set to: ${this.silenceDuration}ms`);
    }

    /**
     * Set minimum speech duration (ms)
     */
    setMinSpeechDuration(duration) {
        this.minSpeechDuration = Math.max(100, duration);
        console.log(`Min speech duration set to: ${this.minSpeechDuration}ms`);
    }

    /**
     * Get current volume level (0-1)
     */
    getCurrentVolume() {
        if (!this.analyser) return 0;

        this.analyser.getByteFrequencyData(this.dataArray);
        const energy = this.calculateEnergy();
        return energy / 255;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopMonitoring();

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.dataArray = null;
    }
}
