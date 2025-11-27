/**
 * API client wrapper for making HTTP requests to the backend
 * Provides methods for authentication, user, and chat endpoints
 */

const API_BASE_URL = 'http://localhost:5000';

class API {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Generic request method
     * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
     * @param {object} options - Fetch options (method, body, headers, etc.)
     * @returns {Promise<{success: boolean, data: any, error?: string}>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include', // Important for session cookies
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            return {
                success: response.ok,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('API request error:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // ===== AUTHENTICATION ENDPOINTS =====

    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async signup(email, password) {
        return this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    /**
     * Log in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    /**
     * Log out the current user
     */
    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<{authenticated: boolean, user?: object}>}
     */
    async checkAuth() {
        return this.request('/api/auth/check', {
            method: 'GET'
        });
    }

    // ===== USER ENDPOINTS =====

    /**
     * Get current user's profile
     * @returns {Promise<{id: number, email: string, created_at: string}>}
     */
    async getProfile() {
        return this.request('/api/user/profile', {
            method: 'GET'
        });
    }

    // ===== CHAT ENDPOINTS =====

    /**
     * Get list of all chats for current user
     * @returns {Promise<{chats: Array}>}
     */
    async listChats() {
        return this.request('/api/chat/list', {
            method: 'GET'
        });
    }

    /**
     * Create a new chat
     * @returns {Promise<{chat_id: number, title: string, created_at: string}>}
     */
    async createChat() {
        return this.request('/api/chat/create', {
            method: 'POST'
        });
    }

    /**
     * Get all messages in a chat
     * @param {number} chatId - Chat ID
     * @returns {Promise<{messages: Array}>}
     */
    async getChatMessages(chatId) {
        return this.request(`/api/chat/${chatId}/messages`, {
            method: 'GET'
        });
    }
}

// Export singleton instance
export const api = new API();
