// Central hook for all authentication actions in the app.
// Screens import this instead of calling the API directly.
//
// Covers: login, signup, forgot password, reset password,
// email verification, and resending verification emails.

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { login, signup, resetPassword, verifyResetToken, verifyEmail, resendVerification, forgotPassword, logout, checkAuth } from '../services/api-client';
import { validatePassword } from '../components/password-requirements';


interface AuthState {
  loading: boolean;
  error: string;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ loading: false, error: '' });

  const clearError = () => setState(prev => ({ ...prev, error: '' }));

  // Validates fields, calls login API, navigates to chat on success.
  // Returns error string so screen can trigger shake animation.
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    if (!email.trim() || !password) {
      const msg = 'Please fill in both fields';
      setState({ loading: false, error: msg });
      return msg;
    }

    setState({ loading: true, error: '' });
    try {
      const data = await login(email.trim().toLowerCase(), password);
      if (data.success) { router.replace('/chat'); return null; }
      const msg = data.message || 'Login failed. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    } catch {
      const msg = 'Could not connect. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    }
  };

  // Validates all signup fields, calls signup API, navigates to verify-email on success.
  // Returns error string so screen can trigger shake animation.
  const handleSignup = async (
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<string | null> => {
    const validationError = (() => {
      if (!email.trim() || !password || !confirmPassword) return 'Please fill in all fields';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
      const pwErr = validatePassword(password);
      if (pwErr) return pwErr;
      if (password !== confirmPassword) return 'Passwords do not match';
      return null;
    })();
    if (validationError) {
      setState({ loading: false, error: validationError });
      return validationError;
    }

    setState({ loading: true, error: '' });
    try {
      const data = await signup(email.trim().toLowerCase(), password);
      if (data.success) {
        router.replace({
          pathname: '/verify-email',
          params: { email: email.trim().toLowerCase() },
        });
        return null;
      }
      const msg = data.message || 'Sign up failed. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    } catch (err: any) {
      const msg = err?.message || 'Could not connect. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    }
  };

  // Validates token and passwords, calls reset API.
  // Returns error string so screen can trigger shake, or null on success.
  const handleResetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<string | null> => {
    const resetValidationError = (() => {
      if (!token) return 'Invalid or missing reset link.';
      const pwErr = validatePassword(password);
      if (pwErr) return pwErr;
      if (password !== confirmPassword) return 'Passwords do not match';
      return null;
    })();
    if (resetValidationError) {
      setState({ loading: false, error: resetValidationError });
      return resetValidationError;
    }

    setState({ loading: true, error: '' });
    try {
      const data = await resetPassword(token, password);
      if (data.success) { setState({ loading: false, error: '' }); return null; }
      const msg = data.message || 'Reset failed. The link may have expired.';
      setState({ loading: false, error: msg });
      return msg;
    } catch {
      const msg = 'An error occurred. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    }
  };

  // Validates a password reset token without consuming it.
  // Returns the status and message so the screen can gate the password form.
  const handleVerifyResetToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await verifyResetToken(token);
      if (data.success) return { success: true, message: '' };
      return { success: false, message: data.message || 'Invalid or expired reset token.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred. Please try again.' };
    }
  };

  // Calls the verify endpoint with the token from the URL.
  // Returns the status and message so the screen can display the right UI state.
  const handleVerifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = await verifyEmail(token);
      if (data.success) {
        return { success: true, message: data.message || 'Email verified! You can now sign in.' };
      }
      return { success: false, message: data.message || 'Verification failed. The link may have expired.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred. Please try again.' };
    }
  };

  // Requests a new verification email.
  // Always resolves as success — intentional, so we don't reveal if an email is registered.
  const handleResendVerification = async (email: string): Promise<void> => {
    try {
      await resendVerification(email.trim().toLowerCase());
    } catch {
    }
  };

  // Validates email format then requests a password reset link.
  // Returns error string for shake, or null on success.
  // Always shows success on screen — doesn't reveal if email is registered.
  const handleForgotPassword = async (email: string): Promise<string | null> => {
    if (!email.trim()) {
      const msg = 'Please enter your email address';
      setState({ loading: false, error: msg });
      return msg;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = 'Please enter a valid email address';
      setState({ loading: false, error: msg });
      return msg;
    }

    setState({ loading: true, error: '' });
    try {
      await forgotPassword(email.trim().toLowerCase());
      setState({ loading: false, error: '' });
      return null;
    } catch {
      const msg = 'An error occurred. Please try again.';
      setState({ loading: false, error: msg });
      return msg;
    }
  };

  // Logs out the current user and redirects to home
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch {
      // Continue with redirect even if logout request fails
    }
  };

// Checks if a session is active and returns the user's email if so.
// Used by screens that need to know login state without redirecting.
const getSessionUser = async (): Promise<{ loggedIn: boolean; email: string }> => {
  try {
    const data = await checkAuth() as { authenticated: boolean; user?: { email: string } };
    if (data.authenticated) {
      return { loggedIn: true, email: data.user?.email || '' };
    }
    return { loggedIn: false, email: '' };
  } catch {
    return { loggedIn: false, email: '' };
  }
};

  return {
    loading: state.loading,
    error:   state.error,
    clearError,
    handleLogin,
    handleSignup,
    handleResetPassword,
    handleVerifyResetToken,
    handleVerifyEmail,
    handleResendVerification,
    handleForgotPassword,
    handleLogout,
    getSessionUser,
  };
}