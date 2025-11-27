/**
 * Voice Player
 * Handles audio playback for TTS responses.
 * Manages audio queue and playback controls.
 */

class VoicePlayer {
    constructor() {
        this.audioContext = null;
        this.currentAudio = null;
        this.isPlaying = false;
        this.queue = [];

        // Callbacks
        this.onPlayStart = null;
        this.onPlayEnd = null;
        this.onPlayError = null;
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * Play audio from base64 encoded data
     * @param {string} base64Audio - Base64 encoded audio data
     * @param {string} format - Audio format (mp3, wav, etc.)
     */
    async playAudio(base64Audio, format = 'mp3') {
        try {
            // Stop any currently playing audio
            this.stop();

            // Convert base64 to audio blob
            const audioBlob = this.base64ToBlob(base64Audio, format);
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create audio element
            this.currentAudio = new Audio(audioUrl);

            // Set up event listeners
            this.currentAudio.onended = () => {
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                if (this.onPlayEnd) {
                    this.onPlayEnd();
                }
                // Play next in queue if available
                this.playNext();
            };

            this.currentAudio.onerror = (error) => {
                console.error('Audio playback error:', error);
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                if (this.onPlayError) {
                    this.onPlayError(error);
                }
            };

            // Play audio
            this.isPlaying = true;
            if (this.onPlayStart) {
                this.onPlayStart();
            }

            await this.currentAudio.play();

        } catch (error) {
            console.error('Play audio error:', error);
            this.isPlaying = false;
            if (this.onPlayError) {
                this.onPlayError(error);
            }
            throw error;
        }
    }

    /**
     * Add audio to queue for sequential playback
     */
    async queueAudio(base64Audio, format = 'mp3') {
        this.queue.push({ base64Audio, format });

        // If not currently playing, start playback
        if (!this.isPlaying) {
            await this.playNext();
        }
    }

    /**
     * Play next audio in queue
     */
    async playNext() {
        if (this.queue.length === 0) {
            return;
        }

        const { base64Audio, format } = this.queue.shift();
        await this.playAudio(base64Audio, format);
    }

    /**
     * Stop current audio playback
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;
    }

    /**
     * Pause current audio
     */
    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPlaying = false;
        }
    }

    /**
     * Resume paused audio
     */
    resume() {
        if (this.currentAudio && !this.isPlaying) {
            this.currentAudio.play();
            this.isPlaying = true;
        }
    }

    /**
     * Clear audio queue
     */
    clearQueue() {
        this.queue = [];
    }

    /**
     * Convert base64 string to Blob
     */
    base64ToBlob(base64, format) {
        const mimeType = this.getMimeType(format);
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Get MIME type from format
     */
    getMimeType(format) {
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'webm': 'audio/webm',
            'opus': 'audio/opus',
            'flac': 'audio/flac'
        };

        return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
    }

    /**
     * Get current playback time
     */
    getCurrentTime() {
        return this.currentAudio ? this.currentAudio.currentTime : 0;
    }

    /**
     * Get total duration
     */
    getDuration() {
        return this.currentAudio ? this.currentAudio.duration : 0;
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.currentAudio) {
            this.currentAudio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stop();
        this.clearQueue();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
