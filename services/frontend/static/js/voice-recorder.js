/**
 * Voice Recorder
 * Handles audio recording using Web Audio API and MediaRecorder.
 * Provides microphone access, recording, and audio data export.
 */

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;

        // Callbacks
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onRecordingError = null;
        this.onTimerUpdate = null;
    }

    /**
     * Check if browser supports audio recording
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Request microphone permission and initialize recorder
     */
    async initialize() {
        if (!VoiceRecorder.isSupported()) {
            throw new Error('Your browser does not support audio recording');
        }

        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            return true;
        } catch (error) {
            console.error('Microphone access error:', error);
            throw new Error('Microphone access denied. Please allow microphone access to use voice features.');
        }
    }

    /**
     * Start recording audio
     */
    async startRecording() {
        if (this.isRecording) {
            console.warn('Already recording');
            return;
        }

        try {
            // Initialize if not already done
            if (!this.stream) {
                await this.initialize();
            }

            // Reset audio chunks
            this.audioChunks = [];

            // Create MediaRecorder with preferred format
            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType
            });

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                this.stopTimer();
                if (this.onRecordingStop) {
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                    this.onRecordingStop(audioBlob, this.getFormatFromMimeType(mimeType));
                }
            };

            // Handle errors
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                if (this.onRecordingError) {
                    this.onRecordingError(event.error);
                }
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTimer();

            if (this.onRecordingStart) {
                this.onRecordingStart();
            }

        } catch (error) {
            console.error('Start recording error:', error);
            if (this.onRecordingError) {
                this.onRecordingError(error);
            }
            throw error;
        }
    }

    /**
     * Stop recording audio
     */
    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) {
            console.warn('Not currently recording');
            return;
        }

        this.mediaRecorder.stop();
        this.isRecording = false;
    }

    /**
     * Cancel recording without saving
     */
    cancelRecording() {
        if (this.isRecording && this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.audioChunks = [];
            this.stopTimer();
        }
    }

    /**
     * Get supported MIME type for recording
     */
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/wav'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        // Fallback to default
        return '';
    }

    /**
     * Extract format from MIME type
     */
    getFormatFromMimeType(mimeType) {
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mp4')) return 'mp4';
        if (mimeType.includes('wav')) return 'wav';
        return 'webm'; // default
    }

    /**
     * Start recording timer
     */
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            if (this.onTimerUpdate) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                this.onTimerUpdate(elapsed);
            }
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Convert Blob to base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:audio/...;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Get current recording time in seconds
     */
    getRecordingTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Format seconds to MM:SS
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.cancelRecording();

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
