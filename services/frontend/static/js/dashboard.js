/**
 * Dashboard page logic - Main chat interface
 * Handles chat selection, message display, text streaming, and voice-note flow
 */

import { api } from './api.js';
import { chatSocket } from './websocket.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.currentChatId = null;
        this.chats = [];
        this.currentMessages = [];
        this.isStreaming = false;
        this.currentStreamingMessage = null;

        // Text chat Socket.IO connection
        this.textSocket = null;

        // Voice features
        this.voiceRecorder = null;
        this.voicePlayer = null;
        this.isRecording = false;
        this.isProcessingVoice = false;
        this.voiceFinalizeTimer = null;

        // DOM elements
        this.elements = {
            userEmail: document.getElementById('user-email'),
            newChatBtn: document.getElementById('new-chat-btn'),
            chatList: document.getElementById('chat-list'),
            chatTitle: document.getElementById('chat-title'),
            renameChatBtn: document.getElementById('rename-chat-btn'),
            messagesContainer: document.getElementById('messages-container'),
            emptyState: document.getElementById('empty-state'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            voiceBtn: document.getElementById('voice-btn'),
            cancelRecordingBtn: document.getElementById('cancel-recording-btn'),
            sttCheckbox: document.getElementById('stt-checkbox'),
            voiceStatus: document.getElementById('voice-status'),
            recordingTime: document.getElementById('recording-time'),
            voiceStatusText: document.getElementById('voice-status-text'),
            voiceIconMic: document.getElementById('voice-icon-mic'),
            voiceIconStop: document.getElementById('voice-icon-stop'),
            profileBtn: document.getElementById('profile-btn'),
            profileModal: document.getElementById('profile-modal'),
            closeProfileBtn: document.getElementById('close-profile-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            profileEmail: document.getElementById('profile-email'),
            profileCreated: document.getElementById('profile-created'),
            orbVoiceBtn: document.getElementById('orb-voice-btn'),
            orbHint: document.getElementById('orb-hint'),
            orbCancelBtn: document.getElementById('orb-cancel-btn'),
            toggleChatBtn: document.getElementById('toggle-chat-btn'),
            orbInterface: document.getElementById('orb-interface'),
            pillInterface: document.getElementById('pill-interface')
        };
    }

    async init() {
        try {
            await this.checkAuth();
            await this.loadChats();
            await this.connectWebSocket();
            this.initializeVoice();
            this.initializeSpeechToText();
            this.setupEventListeners();

            // Orb is default mode
            document.body.classList.add('orb-mode');

            // Orb + input always available — auto-creates a chat if needed
            if (this.elements.orbVoiceBtn) this.elements.orbVoiceBtn.disabled = false;
            if (this.elements.toggleChatBtn) this.elements.toggleChatBtn.disabled = false;
            this.elements.messageInput.disabled = false;
            this.elements.sendBtn.disabled = false;
            this.elements.voiceBtn.disabled = false;
            if (this.elements.sttCheckbox) this.elements.sttCheckbox.disabled = false;

            console.log('Dashboard initialized');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            window.location.href = '/landing.html';
        }
    }

    async checkAuth() {
        const result = await api.checkAuth();

        if (!result.success || !result.data.authenticated) {
            throw new Error('Not authenticated');
        }

        this.currentUser = result.data.user;
        this.elements.userEmail.textContent = this.currentUser.email;
    }

    async loadChats() {
        const result = await api.listChats();

        if (result.success && result.data.chats) {
            this.chats = result.data.chats;
            this.renderChatList();

            if (this.chats.length > 0 && !this.currentChatId) {
                await this.selectChat(this.chats[0].id);
            }
        }
    }

    renderChatList() {
        this.elements.chatList.innerHTML = '';

        if (this.chats.length === 0) {
            this.elements.chatList.innerHTML =
                '<p style="padding: 16px; color: var(--text-secondary); text-align: center;">No chats yet</p>';
            return;
        }

        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.chatId = chat.id;

            if (chat.id === this.currentChatId) {
                chatItem.classList.add('active');
            }

            const titleDiv = document.createElement('div');
            titleDiv.className = 'chat-item-title';
            titleDiv.textContent = chat.title;
            chatItem.appendChild(titleDiv);

            chatItem.addEventListener('click', () => this.selectChat(chat.id));

            this.elements.chatList.appendChild(chatItem);
        });
    }

    async selectChat(chatId) {
        try {
            this.currentChatId = chatId;

            document.querySelectorAll('.chat-item').forEach(item => {
                if (parseInt(item.dataset.chatId) === chatId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            const result = await api.getChatMessages(chatId);

            if (result.success && result.data.messages) {
                this.currentMessages = result.data.messages;
                this.renderMessages();

                const chat = this.chats.find(c => c.id === chatId);
                if (chat) {
                    this.elements.chatTitle.textContent = chat.title;
                }

                this.elements.messageInput.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.voiceBtn.disabled = false;
                if (this.elements.sttCheckbox) this.elements.sttCheckbox.disabled = false;

                if (this.elements.renameChatBtn) this.elements.renameChatBtn.style.display = 'flex';

                if (this.elements.orbVoiceBtn) this.elements.orbVoiceBtn.disabled = false;
                if (this.elements.toggleChatBtn) this.elements.toggleChatBtn.disabled = false;

                this.elements.messageInput.focus();
            }
        } catch (error) {
            console.error('Error selecting chat:', error);
        }
    }

    renderMessages() {
        this.elements.messagesContainer.innerHTML = '';
        this.elements.messagesContainer.appendChild(this.elements.emptyState);
        this.elements.emptyState.style.display = 'none';

        if (this.currentMessages.length === 0) {
            this.elements.emptyState.style.display = 'flex';
            return;
        }

        this.currentMessages.forEach(message => {
            this.renderMessage(message);
        });

        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + message.role;
        if (message.id) messageDiv.dataset.messageId = message.id;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content || '';

        if (message.role === 'assistant' && !message.content) {
            bubble.classList.add('message-bubble--loading');
            const loader = document.createElement('div');
            loader.className = 'three-body';
            loader.innerHTML = '<div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div>';
            bubble.appendChild(loader);
        }

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        if (message.role === 'assistant' && !message.content) {
            time.style.display = 'none';
        }

        bubble.appendChild(content);
        bubble.appendChild(time);
        messageDiv.appendChild(bubble);
        this.elements.messagesContainer.appendChild(messageDiv);

        return messageDiv;
    }

    async renameChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        const current = chat ? chat.title : '';
        const newTitle = prompt('Rename chat:', current);
        if (!newTitle || newTitle.trim() === current) return;

        const result = await api.renameChat(chatId, newTitle.trim());
        if (result.success) {
            chat.title = result.data.title;
            this.renderChatList();
            if (this.currentChatId === chatId) {
                this.elements.chatTitle.textContent = result.data.title;
            }
        } else {
            alert('Failed to rename chat');
        }
    }

    async createNewChat() {
        try {
            const result = await api.createChat();

            if (result.success && result.data.chat_id) {
                const newChat = {
                    id: result.data.chat_id,
                    title: result.data.title,
                    created_at: result.data.created_at,
                    last_message_time: result.data.created_at
                };

                this.chats.unshift(newChat);
                this.renderChatList();
                await this.selectChat(newChat.id);
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
            alert('Failed to create new chat');
        }
    }

    async connectWebSocket() {
        try {
            this.textSocket = io('http://localhost:5000', { withCredentials: true });

            this.textSocket.on('message_token', data => this.handleTokenReceived(data));
            this.textSocket.on('message_complete', data => this.handleMessageComplete(data));
            this.textSocket.on('error', data => this.handleError(data));

            chatSocket.onVoiceTranscribed(data => this.handleVoiceTranscribed(data));
            chatSocket.onVoiceProcessing(data => this.handleVoiceProcessing(data));
            chatSocket.onVoiceResponse(data => this.handleVoiceResponse(data));
            chatSocket.onError(data => this.handleError(data));

            console.log('WebSocket handlers registered');
        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();

        if (!message || this.isStreaming || this.isProcessingVoice) return;

        if (!this.currentChatId) {
            await this.createNewChat();
            if (!this.currentChatId) return;
        }

        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        document.getElementById('chat-input-container').classList.remove('has-text');
        // Hide empty state when first message is sent
        this.elements.emptyState.style.display = 'none';

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        this.currentMessages.push(userMessage);
        this.renderMessage(userMessage);
        this.scrollToBottom();

        const assistantMessage = {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString()
        };

        this.currentMessages.push(assistantMessage);
        this.currentStreamingMessage = this.renderMessage(assistantMessage);
        this._loaderTransitioning = false;
        this._loaderTokenBuffer = '';
        this.scrollToBottom();

        this.isStreaming = true;
        this.elements.messageInput.disabled = true;
        this.elements.sendBtn.disabled = true;

        this.textSocket.emit('send_message', {
            chat_id: this.currentChatId,
            message: message
        });
    }

    handleTokenReceived(data) {
        if (!this.currentStreamingMessage) return;

        const loader = this.currentStreamingMessage.querySelector('.three-body');
        const contentDiv = this.currentStreamingMessage.querySelector('.message-content');

        if (loader) {
            this._loaderTokenBuffer = (this._loaderTokenBuffer || '') + data.text;
            if (!this._loaderTransitioning) {
                this._transitionLoaderToText(this._loaderTokenBuffer);
            }
            return;
        }

        contentDiv.textContent += data.text;
        this.scrollToBottom();
    }

    handleMessageComplete(data) {
        if (this.currentStreamingMessage) {
            const contentDiv = this.currentStreamingMessage.querySelector('.message-content');
            const lastMessage = this.currentMessages[this.currentMessages.length - 1];
            lastMessage.content = data.full_text;
            lastMessage.id = data.message_id;

            // If still transitioning from loader, hold the final text until the transition ends
            if (this._loaderTransitioning) {
                this._loaderTokenBuffer = data.full_text;
            } else {
                contentDiv.textContent = data.full_text;
            }
        }

        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.elements.messageInput.disabled = false;
        this.elements.sendBtn.disabled = false;
        this.elements.messageInput.focus();

        // Keep disabled for now to avoid wiping non-persisted voice-note messages
        // this.updateChatTitleIfNeeded();

        this.scrollToBottom();
    }

    handleError(data) {
        console.error('WebSocket error:', data);
        alert(data.message || data.error || 'An error occurred');

        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.elements.messageInput.disabled = false;
        this.elements.sendBtn.disabled = false;
        this.elements.voiceBtn.disabled = false;
        this.isProcessingVoice = false;
    }

    async updateChatTitleIfNeeded() {
        await this.loadChats();
    }

    setupEventListeners() {
        this.elements.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

        this.elements.messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.messageInput.addEventListener('input', e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            document.getElementById('chat-input-container')
                .classList.toggle('has-text', e.target.value.trim().length > 0);
        });

        this.elements.voiceBtn.addEventListener('click', () => this.showOrbMode());
        this.elements.cancelRecordingBtn.addEventListener('click', () => this.cancelVoiceRecording());

        if (this.elements.orbVoiceBtn) {
            this.elements.orbVoiceBtn.addEventListener('click', () => this.toggleOrbVoiceRecording());
        }
        if (this.elements.toggleChatBtn) {
            this.elements.toggleChatBtn.addEventListener('click', () => this.showChatMode());
        }
        if (this.elements.orbCancelBtn) {
            this.elements.orbCancelBtn.addEventListener('click', () => this.cancelVoiceRecording());
        }

        if (this.elements.renameChatBtn) {
            this.elements.renameChatBtn.addEventListener('click', () => this.renameChat(this.currentChatId));
        }
        this.elements.profileBtn.addEventListener('click', () => this.showProfile());
        this.elements.closeProfileBtn.addEventListener('click', () => this.hideProfile());
        this.elements.profileModal.addEventListener('click', e => {
            if (e.target === this.elements.profileModal) {
                this.hideProfile();
            }
        });

        this.elements.logoutBtn.addEventListener('click', () => this.logout());

        const darkToggle = document.getElementById('theme');
        if (darkToggle) {
            if (localStorage.getItem('darkTheme') === 'true') {
                document.body.classList.add('dark-theme');
                darkToggle.checked = true;
            }
            darkToggle.addEventListener('change', () => {
                document.body.classList.toggle('dark-theme', darkToggle.checked);
                localStorage.setItem('darkTheme', darkToggle.checked);
            });
        }
    }

    async showProfile() {
        try {
            const result = await api.getProfile();

            if (result.success) {
                this.elements.profileEmail.textContent = result.data.email;
                this.elements.profileCreated.textContent = this.formatDate(result.data.created_at);
                this.elements.profileModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    hideProfile() {
        this.elements.profileModal.style.display = 'none';
    }

    async logout() {
        try {
            chatSocket.disconnect();
            if (this.textSocket) this.textSocket.disconnect();
            await api.logout();
            window.location.href = '/landing.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/landing.html';
        }
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return days + 'd ago';
        if (hours > 0) return hours + 'h ago';
        if (minutes > 0) return minutes + 'm ago';
        return 'Just now';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ======================
    // Voice Features
    // ======================

    initializeVoice() {
        if (typeof VoiceRecorder === 'undefined' || typeof VoicePlayer === 'undefined') {
            console.warn('Voice features not available');
            this.elements.voiceBtn.style.display = 'none';
            return;
        }

        if (!VoiceRecorder.isSupported()) {
            console.warn('Voice recording not supported in this browser');
            this.elements.voiceBtn.style.display = 'none';
            return;
        }

        this.voiceRecorder = new VoiceRecorder();

        this.voiceRecorder.onRecordingStart = () => {
            console.log('Recording started');
        };

        this.voiceRecorder.onRecordingStop = async (audioBlob, format) => {
            await this.handleRecordingComplete(audioBlob, format);
        };

        this.voiceRecorder.onRecordingError = error => {
            console.error('Recording error:', error);
            alert(error.message || 'Failed to record audio');
            this.resetVoiceUI();
        };

        this.voiceRecorder.onTimerUpdate = seconds => {
            this.elements.recordingTime.textContent = VoiceRecorder.formatTime(seconds);
        };

        this.voicePlayer = new VoicePlayer();

        this.voicePlayer.onPlayStart = () => {
            console.log('Playback started');
            this._amandaPlayedAudio = true;
        };

        this.voicePlayer.onPlayEnd = () => {
            console.log('Playback chunk ended');
        };

        // IMPORTANT FIX:
        // Reset UI when audio queue finishes.
        this.voicePlayer.onQueueEmpty = () => {
            console.log('Voice playback queue finished');
            this.finalizeVoiceResponse();
        };

        this.voicePlayer.onPlayError = error => {
            console.error('Playback error:', error);
            this.finalizeVoiceResponse();
        };

        console.log('Voice features initialized');
    }

    initializeSpeechToText() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            if (this.elements.sttCheckbox) {
                this.elements.sttCheckbox.closest('label')?.remove();
                this.elements.sttCheckbox.remove();
            }
            return;
        }

        this.sttRecognition = new SpeechRecognition();
        this.sttRecognition.continuous = true;
        this.sttRecognition.interimResults = true;
        this.sttRecognition.lang = 'en-US';

        // Track the base text (what was typed before this STT session started)
        this._sttBaseText = '';

        this.sttRecognition.onstart = () => {
            this._sttBaseText = this.elements.messageInput.value;
        };

        this.sttRecognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = 0; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t + ' ';
                } else {
                    interimTranscript += t;
                }
            }

            const input = this.elements.messageInput;
            if (finalTranscript) {
                input.value = (this._sttBaseText + ' ' + finalTranscript).trim();
                this._sttBaseText = input.value;
            } else if (interimTranscript) {
                input.value = (this._sttBaseText + ' ' + interimTranscript).trim();
            }

            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            document.getElementById('chat-input-container')
                .classList.toggle('has-text', input.value.trim().length > 0);
        };

        const stopSTT = () => {
            if (this.elements.sttCheckbox) this.elements.sttCheckbox.checked = false;
            this.elements.messageInput.placeholder = 'Message Amanda...';
        };

        this.sttRecognition.onend = stopSTT;
        this.sttRecognition.onerror = (event) => {
            if (event.error !== 'no-speech') console.error('STT error:', event.error);
            stopSTT();
        };

        this.elements.sttCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                try {
                    this.elements.messageInput.placeholder = 'Listening...';
                    this.sttRecognition.start();
                } catch (err) {
                    console.error('STT start error:', err);
                    e.target.checked = false;
                    this.elements.messageInput.placeholder = 'Message Amanda...';
                }
            } else {
                this.sttRecognition.stop();
                this.elements.messageInput.placeholder = 'Message Amanda...';
            }
        });

        console.log('Speech-to-text initialized');
    }

    cancelVoiceRecording() {
        if (!this.isRecording) return;
        this._voiceCancelled = true;
        this.voiceRecorder.cancelRecording();
        this.isRecording = false;
        this.resetVoiceUI();
    }

    async toggleVoiceRecording() {
        if (this.isRecording) {
            this.voiceRecorder.stopRecording();
            this.isRecording = false;
        } else {
            if (!this.currentChatId || this.isStreaming || this.isProcessingVoice) {
                return;
            }

            try {
                await this.voiceRecorder.startRecording();
                this.isRecording = true;
                this.updateVoiceUI(true);
            } catch (error) {
                console.error('Failed to start recording:', error);
                alert(error.message || 'Failed to start recording');
            }
        }
    }

    updateVoiceUI(recording) {
        if (recording) {
            this.elements.voiceIconMic.style.display = 'none';
            this.elements.voiceIconStop.style.display = 'block';
            this.elements.voiceBtn.classList.add('recording');
            this.elements.voiceBtn.classList.remove('processing');
            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatusText.textContent = 'Recording...';

            this.elements.messageInput.disabled = true;
            this.elements.sendBtn.disabled = true;
        } else {
            this.elements.voiceIconMic.style.display = 'block';
            this.elements.voiceIconStop.style.display = 'none';
            this.elements.voiceBtn.classList.remove('recording');

            if (!this.isProcessingVoice) {
                this.elements.voiceStatus.style.display = 'none';
                this.elements.voiceStatus.classList.remove('processing');
            }

            if (!this.isStreaming && !this.isProcessingVoice) {
                this.elements.messageInput.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.voiceBtn.disabled = false;
            }
        }
    }

    resetVoiceUI() {
        this.isRecording = false;
        this.isProcessingVoice = false;

        if (this.voiceFinalizeTimer) {
            clearTimeout(this.voiceFinalizeTimer);
            this.voiceFinalizeTimer = null;
        }

        this.updateVoiceUI(false);
        this.elements.voiceBtn.classList.remove('processing');
        this.elements.voiceBtn.classList.remove('recording');
        this.elements.voiceBtn.disabled = false;

        this.elements.voiceStatus.style.display = 'none';
        this.elements.voiceStatus.classList.remove('processing');

        this.elements.messageInput.disabled = false;
        this.elements.sendBtn.disabled = false;

        if (this.elements.orbVoiceBtn) {
            this.elements.orbVoiceBtn.classList.remove('recording');
        }
        if (this.elements.orbHint) {
            this.elements.orbHint.textContent = 'Tap to speak';
        }
        if (this.elements.toggleChatBtn) {
            this.elements.toggleChatBtn.classList.remove('orb-busy');
        }
    }

    showChatMode() {
        document.body.classList.remove('orb-mode');
        this.elements.orbInterface.classList.add('hidden');
        this.elements.pillInterface.style.display = 'flex';
        requestAnimationFrame(() => {
            this.elements.pillInterface.classList.add('visible');
        });
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.remove('anim-slide-up');
            void this.elements.emptyState.offsetWidth;
            this.elements.emptyState.classList.add('anim-slide-down');
        }
        this.elements.messageInput.focus();
    }

    showOrbMode() {
        document.body.classList.add('orb-mode');
        this.elements.pillInterface.classList.remove('visible');
        // Hide immediately so the layout reposition at t=350ms is invisible
        if (this.elements.emptyState) {
            this.elements.emptyState.classList.remove('anim-slide-down');
            this.elements.emptyState.style.opacity = '0';
        }
        setTimeout(() => {
            this.elements.pillInterface.style.display = 'none';
            this.elements.orbInterface.classList.remove('hidden');
            // Layout settled — animate in from new centered position
            if (this.elements.emptyState) {
                this.elements.emptyState.style.opacity = '';
                void this.elements.emptyState.offsetWidth;
                this.elements.emptyState.classList.add('anim-slide-up');
            }
        }, 350);
    }

    async toggleOrbVoiceRecording() {
        if (this.isRecording) {
            this.voiceRecorder.stopRecording();
            this.isRecording = false;
            this.elements.orbVoiceBtn.classList.remove('recording');
            this.elements.orbHint.textContent = 'Tap to speak';
        } else {
            if (this.isStreaming || this.isProcessingVoice) return;
            if (!this.currentChatId) {
                await this.createNewChat();
                if (!this.currentChatId) return;
            }
            try {
                await this.voiceRecorder.startRecording();
                this.isRecording = true;
                this.elements.orbVoiceBtn.classList.add('recording');
                this.elements.orbHint.textContent = 'Tap to stop';
                if (this.elements.toggleChatBtn) {
                    this.elements.toggleChatBtn.classList.add('orb-busy');
                }
                // show recording time in hint
                this.voiceRecorder.onTimerUpdate = seconds => {
                    this.elements.orbHint.textContent = `Tap to stop · ${VoiceRecorder.formatTime(seconds)}`;
                };
            } catch (error) {
                console.error('Failed to start recording:', error);
                alert(error.message || 'Failed to start recording');
            }
        }
    }

    finalizeVoiceResponse() {
        if (this.voiceFinalizeTimer) {
            clearTimeout(this.voiceFinalizeTimer);
        }

        this.voiceFinalizeTimer = setTimeout(() => {
            const amandaSpoke = this._amandaPlayedAudio;
            this._amandaPlayedAudio = false;
            this.resetVoiceUI();
            // Auto-start listening only if Amanda actually played audio (not on clearQueue)
            if (amandaSpoke && document.body.classList.contains('orb-mode') && !this._voiceCancelled) {
                this.toggleOrbVoiceRecording();
            }
        }, 250);
    }

    async handleRecordingComplete(audioBlob, format) {
        if (this._voiceCancelled) {
            this._voiceCancelled = false;
            return;
        }
        try {
            this.updateVoiceUI(false);
            this.isProcessingVoice = true;

            if (this.voiceFinalizeTimer) {
                clearTimeout(this.voiceFinalizeTimer);
                this.voiceFinalizeTimer = null;
            }

            this.voicePlayer.clearQueue();

            this.elements.voiceBtn.classList.add('processing');
            this.elements.voiceBtn.disabled = true;

            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatus.classList.add('processing');
            this.elements.voiceStatusText.textContent = 'Processing audio...';

            const audioBase64 = await this.voiceRecorder.blobToBase64(audioBlob);

            await chatSocket.sendVoiceMessage(this.currentChatId, audioBase64, format, {
                userId: this.currentUser?.id || 1
            });
        } catch (error) {
            console.error('Error processing recording:', error);
            alert('Failed to process audio');
            this.resetVoiceUI();
        }
    }

    handleVoiceTranscribed(data) {
        if (data.role === 'user') {
            console.log('User transcript:', data.text);

            this.elements.voiceStatusText.textContent = 'Transcribed! Getting response...';
            this.elements.emptyState.style.display = 'none';

            const userMessage = {
                role: 'user',
                content: data.text,
                timestamp: new Date().toISOString(),
                isVoice: true
            };

            this.currentMessages.push(userMessage);
            this.renderMessage(userMessage);
            this.scrollToBottom();

            const assistantMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                isVoice: true
            };

            this.currentMessages.push(assistantMessage);
            this.currentStreamingMessage = this.renderMessage(assistantMessage);
            this._loaderTransitioning = false;
            this._loaderTokenBuffer = '';
            this.scrollToBottom();

            this.isStreaming = true;
            return;
        }

        if (data.role === 'assistant') {
            if (!this.currentStreamingMessage) return;

            const text = data.text || '';
            this._transitionLoaderToText(text, () => {
                if (data.is_final) {
                    this.isStreaming = false;
                    this.currentStreamingMessage = null;
                }
            });
        }
    }

    _transitionLoaderToText(text, onComplete) {
        if (!this.currentStreamingMessage) return;

        const loader = this.currentStreamingMessage.querySelector('.three-body');
        const contentDiv = this.currentStreamingMessage.querySelector('.message-content');

        if (loader) {
            this._loaderTokenBuffer = text;

            if (this._loaderTransitioning) return;
            this._loaderTransitioning = true;

            const bubble = this.currentStreamingMessage.querySelector('.message-bubble');
            bubble.style.transition = 'opacity 0.5s ease-in-out';
            bubble.style.opacity = '0';

            setTimeout(() => {
                loader.remove();
                bubble.classList.remove('message-bubble--loading');
                contentDiv.textContent = this._loaderTokenBuffer;
                this._loaderTokenBuffer = '';
                const timeDiv = this.currentStreamingMessage?.querySelector('.message-time');
                if (timeDiv) timeDiv.style.display = '';

                requestAnimationFrame(() => {
                    bubble.style.transition = 'opacity 0.6s ease-in-out';
                    bubble.style.opacity = '1';
                    setTimeout(() => {
                        bubble.style.transition = '';
                        this._loaderTransitioning = false;
                        if (onComplete) onComplete();
                    }, 600);
                });

                this.scrollToBottom();
            }, 500);
        } else {
            contentDiv.textContent = text;
            this.scrollToBottom();
            if (onComplete) onComplete();
        }
    }

    handleVoiceProcessing(data) {
        console.log('Voice processing:', data.status);

        const statusMessages = {
            transcribing: 'Transcribing audio...',
            thinking: 'Amanda is thinking...',
            speaking: 'Amanda is speaking...'
        };

        if (statusMessages[data.status]) {
            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatus.classList.add('processing');
            this.elements.voiceStatusText.textContent = statusMessages[data.status];
        }
    }

    async handleVoiceResponse(data) {
        console.log('Voice response chunk received');

        try {
            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatus.classList.add('processing');
            this.elements.voiceStatusText.textContent = 'Amanda is speaking...';

            await this.voicePlayer.queueAudio(data.data, data.format || 'mp3');
        } catch (error) {
            console.error('Error queueing voice response:', error);
            this.finalizeVoiceResponse();
        }
    }
}

// Initialize dashboard on page load
const dashboard = new Dashboard();
dashboard.init();