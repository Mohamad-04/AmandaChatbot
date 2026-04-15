// Base HTTP client for communicating with the Amanda Flask backend.
// All API calls in the app go through this file.

import { BACKEND_URL } from '../constants/config';

// Core fetch wrapper. Attaches headers, handles JSON body serialisation,
// and includes credentials (cookies) for session-based auth.
async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMessage = 'Something went wrong. Please try again.';
    try {
      const errData = await res.json();
      if (errData.message) errorMessage = errData.message;
    } catch {
      // Keep default message if response isn't JSON
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

// Auth endpoints — checking if a session is still active
export const checkAuth = () => request('GET', '/api/auth/check');

// Chat list — fetches all conversations for the logged-in user
export const listChats = () => request('GET', '/api/chat/list');

// Chat creation — starts a new therapy session/conversation
export const createChat = () => request('POST', '/api/chat/create');

// Message history — fetches all messages for a specific chat by ID
export const getMessages = (chatId: number) =>
  request('GET', `/api/chat/${chatId}/messages`);

// Login — sends credentials and returns success/message from Flask
export const login = (email: string, password: string) =>
  request<{ success: boolean; message?: string }>('POST', '/api/auth/login', { email, password });

// Signup — registers a new user and returns success/message from Flask
export const signup = (email: string, password: string) =>
  request<{ success: boolean; message?: string }>('POST', '/api/auth/signup', { email, password });

// Verify reset token — checks token is valid without consuming it
export const verifyResetToken = (token: string) =>
  request<{ success: boolean; message?: string }>('POST', '/api/auth/verify-reset-token', { token });

// Reset password — submits the token from email link and new password
export const resetPassword = (token: string, password: string) =>
  request<{ success: boolean; message?: string }>('POST', '/api/auth/reset-password', { token, password });

// Verify email — submits the token from the verification link
export const verifyEmail = (token: string) =>
  request<{ success: boolean; message?: string }>('POST', '/api/auth/verify-email', { token });

// Resend verification — sends a new link to the given email
// Always returns success on the API side for security (don't reveal if email exists)
export const resendVerification = (email: string) =>
  request<{ success: boolean }>('POST', '/api/auth/resend-verification', { email });

// Forgot password — sends a reset link to the given email
// Always resolves successfully on the API side for security
export const forgotPassword = (email: string) =>
  request<{ success: boolean }>('POST', '/api/auth/forgot-password', { email });


// Rename a chat conversation
export const renameChat = (chatId: number, title: string) =>
  request<{ success: boolean }>('PUT', `/api/chat/${chatId}/rename`, { title });

// Save a voice message — stored identically to text messages
export const saveMessage = (chatId: number, role: string, content: string) =>
  request<void>('POST', `/api/chat/${chatId}/message`, { role, content });

// Logs the user out and clears their session cookie
export const logout = () =>
  request<{ success: boolean }>('POST', '/api/auth/logout');

// Get the current user's profile (first name, last name, age range)
export const getProfile = () => request('GET', '/api/user/profile');

// Update profile fields — pass only the fields you want to change
export const updateProfile = (data: object) =>
  request<{ success: boolean }>('PATCH', '/api/user/profile', data);

// Permanently delete the logged-in user's account and all their data
export const deleteAccount = () =>
  request<{ success: boolean }>('DELETE', '/api/user/account');

console.log('[API] BACKEND_URL:', BACKEND_URL);
