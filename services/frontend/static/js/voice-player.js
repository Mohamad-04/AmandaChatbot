/**
 * Voice Player
 * Handles queued audio playback for TTS responses.
 * Important: incoming audio chunks are queued and played sequentially,
 * so new chunks do NOT interrupt currently playing speech.
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
        this.onQueueEmpty = null;
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
     * Internal method: play one audio item ONLY.
     * Does not clear existing queue.
     */
    async _playSingle(base64Audio, format = 'mp3') {
        try {
            // Convert base64 to audio blob
            const audioBlob = this.base64ToBlob(base64Audio, format);
            const audioUrl = URL.createObjectURL(audioBlob);

            this.currentAudio = new Audio(audioUrl);

            this.currentAudio.onended = async () => {
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;

                if (this.onPlayEnd) {
                    this.onPlayEnd();
                }

                // Continue with next queued chunk
                await this.playNext();
            };

            this.currentAudio.onerror = async (error) => {
                console.error('Audio playback error:', error);
                this.isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;

                if (this.onPlayError) {
                    this.onPlayError(error);
                }

                // Try to continue queue even if one chunk fails
                await this.playNext();
            };

            this.isPlaying = true;
            if (this.onPlayStart) {
                this.onPlayStart();
            }

            await this.currentAudio.play();
        } catch (error) {
            console.error('Play single audio error:', error);
            this.isPlaying = false;
            this.currentAudio = null;

            if (this.onPlayError) {
                this.onPlayError(error);
            }

            throw error;
        }
    }

    /**
     * Legacy method kept for compatibility.
     * For chunked TTS, this now ENQUEUES instead of interrupting current audio.
     */
    async playAudio(base64Audio, format = 'mp3') {
        return this.queueAudio(base64Audio, format);
    }

    /**
     * Add audio chunk to queue for sequential playback
     */
    async queueAudio(base64Audio, format = 'mp3') {
        this.queue.push({ base64Audio, format });

        // If nothing is currently playing, start immediately
        if (!this.isPlaying) {
            await this.playNext();
        }
    }

    /**
     * Play next audio chunk in queue
     */
    async playNext() {
        if (this.isPlaying) {
            return;
        }

        if (this.queue.length === 0) {
            if (this.onQueueEmpty) {
                this.onQueueEmpty();
            }
            return;
        }

        const { base64Audio, format } = this.queue.shift();
        await this._playSingle(base64Audio, format);
    }

    /**
     * Stop current audio playback and clear everything
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;
        this.clearQueue();
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
     * Check whether all audio playback is done
     */
    isIdle() {
        return !this.isPlaying && this.queue.length === 0;
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

        return mimeTypes[(format || 'mp3').toLowerCase()] || 'audio/mpeg';
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
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}