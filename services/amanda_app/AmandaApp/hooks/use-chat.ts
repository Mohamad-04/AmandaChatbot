// Central hook for all chat functionality — message history, sending messages,
// chat management (create, rename, delete), and the initial auth check on load.
// Connects to the Flask backend via Socket.IO for real-time streaming responses.
// Think of it as the brain of the chat screen — the screen just displays what this returns.

import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import {
  checkAuth,
  listChats,
  createChat,
  getMessages,
  renameChat,
  saveMessage,
} from '../services/api-client';
import { BACKEND_URL } from '../constants/config';

// Shape of a single chat message
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Shape of a chat session from the list endpoint
interface Chat {
  id: number;
  title: string;
}

// Everything the chat screen needs from this hook
interface UseChatReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentChatId: number | null;
  chatTitle: string;
  setChatTitle: (title: string) => void;
  isStreaming: boolean;
  streamingText: string;
  inputText: string;
  setInputText: (text: string) => void;
  isReady: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  userEmail: string;
  currentChatIdRef: React.MutableRefObject<number | null>;
  flatListRef: React.MutableRefObject<any>;
  sendMessage: (text: string) => void;
  loadChat: (chatId: number, title?: string) => Promise<void>;
  handleRename: (newTitle: string) => Promise<boolean>;
  handleNewChat: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  // ── Chat state ─────────────────────────────────────────────────────────
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [chatTitle, setChatTitle] = useState('Amanda');

  // ── Refs ───────────────────────────────────────────────────────────────
  // Ref mirror of currentChatId so async socket callbacks always see latest value
  const currentChatIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamingTextRef = useRef('');
  const flatListRef = useRef<any>(null);

  // Keeps the ref in sync with state on every change
  const updateChatId = (id: number | null) => {
    setCurrentChatId(id);
    currentChatIdRef.current = id;
  };

  // ── Socket connection ──────────────────────────────────────────────────
  // Opens a Socket.IO connection and wires up all streaming response events
  function connectSocket(chatId: number | null) {
    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // ← polling first, then upgrade
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    // Socket is open — screen can now send messages
    socket.on('connect', () => setIsReady(true));

    socket.on('connect_error', (e) => console.log('[Socket] connection error:', e.message));

    // Socket closed — disable send button until reconnected
    socket.on('disconnect', () => setIsReady(false));

    // One streaming word/chunk arriving from Amanda
    socket.on('message_token', (d: { text: string }) => {
      streamingTextRef.current += d.text;
      setStreamingText(streamingTextRef.current);
    });

    // Amanda finished her full response — add to message list
    socket.on('message_complete', (d: { full_text: string }) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: d.full_text || streamingTextRef.current,
      }]);
      streamingTextRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
    });

    // Server error during streaming — reset streaming state cleanly
    socket.on('error', () => {
      streamingTextRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
    });

    socketRef.current = socket;
  }

  // ── Boot — runs every time the chat screen comes into focus ───────────
  // Checks auth, loads or creates a chat, fetches messages, connects socket
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function boot() {
        if (active) setIsLoading(true);

        try {
          const auth = await checkAuth();
          const loggedIn = auth.authenticated === true;

          if (!loggedIn) {
            if (active) {
              setIsAnonymous(true);
              setIsLoading(false);
              connectSocket(null);
            }
            return;
          }

          if (active) {
            setIsAnonymous(false);
            if (auth.user?.email) setUserEmail(auth.user.email);
          }

          let chatId = currentChatIdRef.current;

          if (!chatId) {
            const list = await listChats();
            const chats = list.chats || list.data?.chats || [];

            if (chats.length > 0) {
              chatId = chats[0].id;
              if (active) setChatTitle(chats[0].title || 'New Chat');
            } else {
              const c = await createChat();
              const newId = c.chat_id || c.data?.chat_id;
              if (newId && active) {
                chatId = newId;
                setChatTitle(c.title || c.data?.title || 'New Chat');
              }
            }
            if (active) updateChatId(chatId);
          }

          if (chatId && active) {
            const msgs = await getMessages(chatId);
            const msgList = msgs.messages || msgs.data?.messages || [];
            if (msgList.length > 0) {
              if (active) setMessages(msgList.map((m: any) => ({
                role: m.role,
                content: m.content,
              })));
            }
          }

          if (!socketRef.current?.connected) connectSocket(chatId);
          if (active) setIsLoading(false);

        } catch (e) {
          console.log('[Boot] error:', e);
          if (active) setIsLoading(false);
        }
      }

      boot();

      return () => {
        active = false;
      };
    }, [])
  );

  // ── Send a text message ────────────────────────────────────────────────
  // Adds user message immediately, then emits to Flask via socket
  const sendMessage = useCallback((text: string) => {
    const msg = text.trim();
    if (!msg || isStreaming || !socketRef.current?.connected) return;

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputText('');
    setIsStreaming(true);
    streamingTextRef.current = '';
    setStreamingText('');

    socketRef.current.emit('send_message', {
      chat_id: currentChatIdRef.current || 'anonymous_session',
      message: msg,
    });

    // Small delay so the new message renders before scrolling
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [isStreaming]);

  // ── Load a specific chat by ID ─────────────────────────────────────────
  const loadChat = useCallback(async (chatId: number, title?: string) => {
    setMessages([]);
    updateChatId(chatId);
    if (title) setChatTitle(title);

    const msgs = await getMessages(chatId);
    if (msgs.messages?.length > 0) {
      setMessages(msgs.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })));
    }
  }, []);

  // ── Rename the current chat ────────────────────────────────────────────
  // Returns true on success so the screen can close the rename modal
  const handleRename = async (newTitle: string): Promise<boolean> => {
    if (!newTitle.trim() || !currentChatIdRef.current) return false;
    const r = await renameChat(currentChatIdRef.current, newTitle.trim());
    if (r.success) setChatTitle(newTitle.trim());
    return r.success;
  };

  // ── Create a new empty chat ────────────────────────────────────────────
  const handleNewChat = async (): Promise<void> => {
    const c = await createChat();
    console.log('[Boot] createChat response:', JSON.stringify(c));
    if (c.chat_id) {
      updateChatId(c.chat_id);
      setChatTitle(c.title || 'New Chat');
      setMessages([]);
    }
  };

  return {
    messages,
    setMessages,
    currentChatId,
    chatTitle,
    setChatTitle,
    isStreaming,
    streamingText,
    inputText,
    setInputText,
    isReady,
    isLoading,
    isAnonymous,
    userEmail,
    currentChatIdRef,
    flatListRef,
    sendMessage,
    loadChat,
    handleRename,
    handleNewChat,
  };
}