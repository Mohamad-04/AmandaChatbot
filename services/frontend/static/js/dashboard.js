/**
 * Dashboard page logic - Main chat interface
 * Handles chat selection, message display, and real-time streaming
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

        // DOM elements
        this.elements = {
            userEmail: document.getElementById('user-email'),
            newChatBtn: document.getElementById('new-chat-btn'),
            chatList: document.getElementById('chat-list'),
            chatTitle: document.getElementById('chat-title'),
            voiceChatBtn: document.getElementById('voice-chat-btn'),
            renameChatBtn: document.getElementById('rename-chat-btn'),
            deleteChatBtn: document.getElementById('delete-chat-btn'),
            messagesContainer: document.getElementById('messages-container'),
            emptyState: document.getElementById('empty-state'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            voiceBtn: document.getElementById('voice-btn'),
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
            profileCreated: document.getElementById('profile-created')
        };
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            // Check authentication
            await this.checkAuth();

            // Load chats
            await this.loadChats();

            // Connect to WebSocket
            await this.connectWebSocket();

            // Initialize voice features
            this.initializeVoice();

            // Setup event listeners
            this.setupEventListeners();

            console.log('Dashboard initialized');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            window.location.href = '/landing.html';
        }
    }

    /**
     * Check if user is authenticated
     */
    async checkAuth() {
        const result = await api.checkAuth();
        
        if (!result.success || !result.data.authenticated) {
            throw new Error('Not authenticated');
        }
        
        this.currentUser = result.data.user;
        this.elements.userEmail.textContent = this.currentUser.email;
    }

    /**
     * Load all chats for current user
     */
    async loadChats() {
        const result = await api.listChats();
        
        if (result.success && result.data.chats) {
            this.chats = result.data.chats;
            this.renderChatList();
            
            // Auto-select most recent chat if exists
            if (this.chats.length > 0) {
                await this.selectChat(this.chats[0].id);
            }
        }
    }

    /**
     * Render chat list in sidebar
     */
    renderChatList() {
        this.elements.chatList.innerHTML = '';
        
        if (this.chats.length === 0) {
            this.elements.chatList.innerHTML = '<p style="padding: 16px; color: var(--text-secondary); text-align: center;">No chats yet</p>';
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

            const timeDiv = document.createElement('div');
            timeDiv.className = 'chat-item-time';
            timeDiv.textContent = this.formatRelativeTime(chat.last_message_time);

            chatItem.appendChild(titleDiv);
            chatItem.appendChild(timeDiv);

            chatItem.addEventListener('click', () => this.selectChat(chat.id));

            this.elements.chatList.appendChild(chatItem);
        });
    }

    /**
     * Select a chat and load its messages
     */
    async selectChat(chatId) {
        try {
            this.currentChatId = chatId;
            
            // Update UI
            document.querySelectorAll('.chat-item').forEach(item => {
                if (parseInt(item.dataset.chatId) === chatId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Load messages
            const result = await api.getChatMessages(chatId);
            
            if (result.success && result.data.messages) {
                this.currentMessages = result.data.messages;
                this.renderMessages();
                
                // Update chat title
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) {
                    this.elements.chatTitle.textContent = chat.title;
                }
                
                // Enable input
                this.elements.messageInput.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.voiceBtn.disabled = false;
                this.elements.voiceChatBtn.style.display = 'flex';
                this.elements.renameChatBtn.style.display = 'flex';
                this.elements.deleteChatBtn.style.display = 'flex';
                this.elements.messageInput.focus();
            }
        } catch (error) {
            console.error('Error selecting chat:', error);
        }
    }

    /**
     * Render all messages in the chat
     */
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

    /**
     * Render a single message
     */
    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + message.role;
        messageDiv.dataset.messageId = message.id;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content;

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

    /**
     * Rename a chat
     */
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

    /**
     * Delete a chat
     */
    async deleteChat(chatId) {
        if (!confirm('Delete this chat and all its messages?')) return;

        const result = await api.deleteChat(chatId);
        if (result.success) {
            this.chats = this.chats.filter(c => c.id !== chatId);
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
                this.currentMessages = [];
                this.elements.chatTitle.textContent = 'Select a chat or start a new one';
                this.elements.messagesContainer.innerHTML = '';
                this.elements.messagesContainer.appendChild(this.elements.emptyState);
                this.elements.emptyState.style.display = 'flex';
                this.elements.messageInput.disabled = true;
                this.elements.sendBtn.disabled = true;
                this.elements.voiceBtn.disabled = true;
                this.elements.voiceChatBtn.style.display = 'none';
                this.elements.renameChatBtn.style.display = 'none';
                this.elements.deleteChatBtn.style.display = 'none';
            }
            this.renderChatList();
        } else {
            alert('Failed to delete chat');
        }
    }

    /**
     * Create a new chat
     */
    async createNewChat() {
        try {
            const result = await api.createChat();
            
            if (result.success && result.data.chat_id) {
                // Add to chats list
                const newChat = {
                    id: result.data.chat_id,
                    title: result.data.title,
                    created_at: result.data.created_at,
                    last_message_time: result.data.created_at
                };
                
                this.chats.unshift(newChat);
                this.renderChatList();
                
                // Select the new chat
                await this.selectChat(newChat.id);
            }
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Failed to create new chat');
        }
    }

    /**
     * Connect to WebSocket
     */
    async connectWebSocket() {
        try {
            // Text chat via Socket.IO (chat_handler.py)
            this.textSocket = io('http://localhost:5000', { withCredentials: true });

            this.textSocket.on('message_token', (data) => this.handleTokenReceived(data));
            this.textSocket.on('message_complete', (data) => this.handleMessageComplete(data));
            this.textSocket.on('error', (data) => this.handleError(data));

            // Voice WS listeners (native WS via websocket.js)
            chatSocket.onVoiceTranscribed((data) => this.handleVoiceTranscribed(data));
            chatSocket.onVoiceProcessing((data) => this.handleVoiceProcessing(data));
            chatSocket.onVoiceResponse((data) => this.handleVoiceResponse(data));
            chatSocket.onError((data) => this.handleError(data));

            console.log('WebSocket handlers registered');
        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        
        if (!message || !this.currentChatId || this.isStreaming) {
            return;
        }
        
        // Clear input
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        
        // Hide empty state when first message is sent
        this.elements.emptyState.style.display = 'none';

        // Add user message to UI (optimistic)
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        
        this.currentMessages.push(userMessage);
        this.renderMessage(userMessage);
        this.scrollToBottom();
        
        // Create assistant message placeholder
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

        // Disable input during streaming
        this.isStreaming = true;
        this.elements.messageInput.disabled = true;
        this.elements.sendBtn.disabled = true;
        
        // Send via Socket.IO — backend streams back message_token / message_complete
        this.textSocket.emit('send_message', {
            chat_id: this.currentChatId,
            message: message
        });
    }

    /**
     * Handle incoming message token (streaming)
     */
    handleTokenReceived(data) {
        if (!this.currentStreamingMessage) return;

        const loader = this.currentStreamingMessage.querySelector('.three-body');
        const contentDiv = this.currentStreamingMessage.querySelector('.message-content');

        if (loader) {
            // Buffer tokens that arrive during the fade transition
            this._loaderTokenBuffer = (this._loaderTokenBuffer || '') + data.text;

            if (this._loaderTransitioning) return;
            this._loaderTransitioning = true;

            const bubble = this.currentStreamingMessage.querySelector('.message-bubble');

            // Fade out
            bubble.style.transition = 'opacity 0.5s ease-in-out';
            bubble.style.opacity = '0';

            setTimeout(() => {
                loader.remove();
                bubble.classList.remove('message-bubble--loading');
                contentDiv.textContent = this._loaderTokenBuffer;
                this._loaderTokenBuffer = '';
                const timeDiv = this.currentStreamingMessage?.querySelector('.message-time');
                if (timeDiv) timeDiv.style.display = '';

                // Fade in
                requestAnimationFrame(() => {
                    bubble.style.transition = 'opacity 0.6s ease-in-out';
                    bubble.style.opacity = '1';
                    setTimeout(() => {
                        bubble.style.transition = '';
                        this._loaderTransitioning = false;
                    }, 600);
                });

                this.scrollToBottom();
            }, 500);
            return;
        }

        contentDiv.textContent += data.text;
        this.scrollToBottom();
    }

    /**
     * Handle message completion
     */
    handleMessageComplete(data) {
        // Update the message with final text
        if (this.currentStreamingMessage) {
            const contentDiv = this.currentStreamingMessage.querySelector('.message-content');
            // If still transitioning from loader, buffer the final text
            if (this._loaderTransitioning) {
                this._loaderTokenBuffer = data.full_text;
            }
            contentDiv.textContent = data.full_text;
            
            // Update message in array
            const lastMessage = this.currentMessages[this.currentMessages.length - 1];
            lastMessage.content = data.full_text;
            lastMessage.id = data.message_id;
        }
        
        // Re-enable input
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.elements.messageInput.disabled = false;
        this.elements.sendBtn.disabled = false;
        this.elements.messageInput.focus();
        
        // Update chat title if this was the first message
        this.updateChatTitleIfNeeded();
        
        this.scrollToBottom();
    }

    /**
     * Handle WebSocket errors
     */
    handleError(data) {
        console.error('WebSocket error:', data);
        alert(data.message || 'An error occurred');
        
        // Re-enable input
        this.isStreaming = false;
        this.currentStreamingMessage = null;
        this.elements.messageInput.disabled = false;
        this.elements.sendBtn.disabled = false;
    }

    /**
     * Update chat title if this was the first message
     */
    async updateChatTitleIfNeeded() {
        // Reload chat list to get updated titles
        await this.loadChats();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New chat button
        this.elements.newChatBtn.addEventListener('click', () => this.createNewChat());
        
        // Send button
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Message input - Enter to send, Shift+Enter for newline
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        // Voice button
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());

        // Voice chat button (navigate to dedicated voice chat page)
        this.elements.voiceChatBtn.addEventListener('click', () => this.openVoiceChat());

        // Rename / Delete chat buttons in header
        this.elements.renameChatBtn.addEventListener('click', () => this.renameChat(this.currentChatId));
        this.elements.deleteChatBtn.addEventListener('click', () => this.deleteChat(this.currentChatId));

        // Profile modal
        this.elements.profileBtn.addEventListener('click', () => this.showProfile());
        this.elements.closeProfileBtn.addEventListener('click', () => this.hideProfile());
        this.elements.profileModal.addEventListener('click', (e) => {
            if (e.target === this.elements.profileModal) {
                this.hideProfile();
            }
        });
        
        // Logout button
        this.elements.logoutBtn.addEventListener('click', () => this.logout());

        // Dark theme toggle
        const darkToggle = document.getElementById('theme');
        if (localStorage.getItem('darkTheme') === 'true') {
            document.body.classList.add('dark-theme');
            darkToggle.checked = true;
        }
        darkToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme', darkToggle.checked);
            localStorage.setItem('darkTheme', darkToggle.checked);
        });
    }

    /**
     * Show profile modal
     */
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

    /**
     * Hide profile modal
     */
    hideProfile() {
        this.elements.profileModal.style.display = 'none';
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.logout();
            chatSocket.disconnect();
            window.location.href = '/landing.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/landing.html';
        }
    }

    /**
     * Scroll messages container to bottom
     */
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    /**
     * Format timestamp to relative time
     */
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

    /**
     * Format timestamp to time string
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Format timestamp to date string
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Open dedicated voice chat page
     */
    openVoiceChat() {
        // Save current chat ID to session storage
        if (this.currentChatId) {
            sessionStorage.setItem('current_chat_id', this.currentChatId);
        }

        // Navigate to voice chat page
        window.location.href = '/voice-chat/';
    }

    // ========== Voice Features ==========

    /**
     * Initialize voice recorder and player
     */
    initializeVoice() {
        // Check if voice classes are available
        if (typeof VoiceRecorder === 'undefined' || typeof VoicePlayer === 'undefined') {
            console.warn('Voice features not available');
            this.elements.voiceBtn.style.display = 'none';
            return;
        }

        // Check browser support
        if (!VoiceRecorder.isSupported()) {
            console.warn('Voice recording not supported in this browser');
            this.elements.voiceBtn.style.display = 'none';
            return;
        }

        // Initialize voice recorder
        this.voiceRecorder = new VoiceRecorder();

        // Setup recorder callbacks
        this.voiceRecorder.onRecordingStart = () => {
            console.log('Recording started');
        };

        this.voiceRecorder.onRecordingStop = async (audioBlob, format) => {
            await this.handleRecordingComplete(audioBlob, format);
        };

        this.voiceRecorder.onRecordingError = (error) => {
            console.error('Recording error:', error);
            alert(error.message || 'Failed to record audio');
            this.resetVoiceUI();
        };

        this.voiceRecorder.onTimerUpdate = (seconds) => {
            this.elements.recordingTime.textContent = VoiceRecorder.formatTime(seconds);
        };

        // Initialize voice player
        this.voicePlayer = new VoicePlayer();

        this.voicePlayer.onPlayStart = () => {
            console.log('Playback started');
        };

        this.voicePlayer.onPlayEnd = () => {
            console.log('Playback ended');
        };

        this.voicePlayer.onPlayError = (error) => {
            console.error('Playback error:', error);
        };

        console.log('Voice features initialized');
    }

    /**
     * Toggle voice recording on/off
     */
    async toggleVoiceRecording() {
        if (this.isRecording) {
            // Stop recording
            this.voiceRecorder.stopRecording();
            this.isRecording = false;
        } else {
            // Start recording
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

    /**
     * Update voice button UI for recording state
     */
    updateVoiceUI(recording) {
        if (recording) {
            // Show stop icon, hide mic icon
            this.elements.voiceIconMic.style.display = 'none';
            this.elements.voiceIconStop.style.display = 'block';
            this.elements.voiceBtn.classList.add('recording');
            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatusText.textContent = 'Recording...';

            // Disable other inputs
            this.elements.messageInput.disabled = true;
            this.elements.sendBtn.disabled = true;
        } else {
            // Show mic icon, hide stop icon
            this.elements.voiceIconMic.style.display = 'block';
            this.elements.voiceIconStop.style.display = 'none';
            this.elements.voiceBtn.classList.remove('recording');
            this.elements.voiceStatus.style.display = 'none';

            // Re-enable inputs if not streaming
            if (!this.isStreaming && !this.isProcessingVoice) {
                this.elements.messageInput.disabled = false;
                this.elements.sendBtn.disabled = false;
                this.elements.voiceBtn.disabled = false;
            }
        }
    }

    /**
     * Reset voice UI to default state
     */
    resetVoiceUI() {
        this.isRecording = false;
        this.isProcessingVoice = false;
        this.updateVoiceUI(false);
        this.elements.voiceBtn.classList.remove('processing');
    }

    /**
     * Handle recording complete
     */
    async handleRecordingComplete(audioBlob, format) {
        try {
            this.updateVoiceUI(false);
            this.isProcessingVoice = true;
            this.elements.voiceBtn.classList.add('processing');
            this.elements.voiceBtn.disabled = true;

            // Show processing status
            this.elements.voiceStatus.style.display = 'flex';
            this.elements.voiceStatus.classList.add('processing');
            this.elements.voiceStatusText.textContent = 'Processing audio...';

            // Convert blob to base64
            const audioBase64 = await this.voiceRecorder.blobToBase64(audioBlob);

            // Send voice message via WebSocket
            await chatSocket.sendVoiceMessage(this.currentChatId, audioBase64, format, {
                userId: this.currentUser?.id || 1
            });

        } catch (error) {
            console.error('Error processing recording:', error);
            alert('Failed to process audio');
            this.resetVoiceUI();
        }
    }

    /**
     * Handle voice transcribed event
     */
    handleVoiceTranscribed(data) {
        // data: { type:"transcript", text, role, is_final }
        if (data.role === 'user') {
            console.log('User transcript:', data.text);

            // Update status
            this.elements.voiceStatusText.textContent = 'Transcribed! Getting response...';

            // Add user message to UI
            const userMessage = {
                role: 'user',
                content: data.text,
                timestamp: new Date().toISOString(),
                isVoice: true
            };

            this.currentMessages.push(userMessage);
            this.renderMessage(userMessage);
            this.scrollToBottom();

            // Create assistant placeholder (only once per utterance)
            const assistantMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                isVoice: true
            };

            this.currentMessages.push(assistantMessage);
            this.currentStreamingMessage = this.renderMessage(assistantMessage);

            this.isStreaming = true;
            return;
        }

        if (data.role === 'assistant') {
            // Update assistant message live
            if (!this.currentStreamingMessage) return;
            const contentDiv = this.currentStreamingMessage.querySelector('.message-content');
            contentDiv.textContent = data.text || '';
            this.scrollToBottom();

            // If final, stop streaming state
            if (data.is_final) {
                this.isStreaming = false;
                this.currentStreamingMessage = null;
                this.updateChatTitleIfNeeded();
            }
        }
    }

    /**
     * Handle voice processing status updates
     */
    handleVoiceProcessing(data) {
        console.log('Voice processing:', data.status);

    const statusMessages = {
        'transcribing': 'Transcribing audio...',
        'thinking': 'Amanda is thinking...',
        'speaking': 'Amanda is speaking...'
    };

        if (statusMessages[data.status]) {
            this.elements.voiceStatusText.textContent = statusMessages[data.status];
        }
    }

    /**
     * Handle voice response (audio)
     */
    async handleVoiceResponse(data) {
        console.log('Voice response received');

        try {
            // Hide voice status
            this.elements.voiceStatus.style.display = 'none';
            this.elements.voiceStatus.classList.remove('processing');

            // data: {type:"audio_chunk", data:"<base64>", format:"mp3", is_final:false}
            await this.voicePlayer.playAudio(data.data, data.format || 'mp3');

            // Reset voice UI
            this.resetVoiceUI();

        } catch (error) {
            console.error('Error playing voice response:', error);
            this.resetVoiceUI();
        }
    }
}

// Initialize dashboard on page load
const dashboard = new Dashboard();
dashboard.init();
