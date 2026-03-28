// Sliding drawer that lists the user's chat history.
// Lets the user switch between chats, start a new one, and access their profile.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  TouchableWithoutFeedback, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/use-auth';
import { listChats } from '../services/api-client';
import { sidebarStyles as s, C, SIDEBAR_WIDTH } from '../styles/chat-sidebar.styles';
import ProfilePanel from './profile-panel';

// Shape of a single chat session from the list endpoint
type Chat = {
  id:                number;
  title:             string;
  last_message_time: string;
};

type ChatSidebarProps = {
  visible:       boolean;
  onClose:       () => void;
  currentChatId: number | null;
  onSelectChat:  (chatId: number, title: string) => void;
  onNewChat:     () => void;
  userEmail?:    string;
  aiModel?:      string;
};

// Converts a UTC timestamp into a human-readable relative label
function formatRelativeTime(timestamp: string): string {
  const diff  = Date.now() - new Date(timestamp).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

export default function ChatSidebar({
  visible, onClose, currentChatId, onSelectChat, onNewChat, userEmail, aiModel,
}: ChatSidebarProps) {
  const router = useRouter();
  const { handleLogout } = useAuth();

  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const dimAnim   = useRef(new Animated.Value(0)).current;

  const [chats,       setChats]       = useState<Chat[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Slides drawer in when visible, out when hidden
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue:         visible ? 0 : -SIDEBAR_WIDTH,
        duration:        visible ? 300 : 260,
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue:         visible ? 1 : 0,
        duration:        visible ? 300 : 260,
        useNativeDriver: true,
      }),
    ]).start();

    if (!visible) setShowProfile(false);
  }, [visible]);

  // Fetches the chat list every time the sidebar opens
  useEffect(() => {
    if (visible) loadChats();
  }, [visible]);

  // Loads all chats for the logged-in user from the backend
  async function loadChats() {
    setLoading(true);
    try {
      const data = await listChats();
      if (data.success && data.chats) setChats(data.chats);
    } catch (e) {
      console.log('[ChatSidebar] failed to load chats:', e);
    } finally {
      setLoading(false);
    }
  }

  // Signs the user out then redirects to the home screen
  const handleSignOut = async () => {
    setShowProfile(false);
    onClose();
    await handleLogout();
    setTimeout(() => router.replace('/'), 400);
  };

  const handleSelectChat = (item: Chat) => {
    onSelectChat(item.id, item.title);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  // Renders a single chat row — highlighted if it's the active chat
  const renderChat = useCallback(({ item }: { item: Chat }) => {
    const isActive = item.id === currentChatId;
    return (
      <TouchableOpacity
        style={[s.chatItem, isActive && s.chatItemActive]}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        <View style={s.chatItemInner}>
          <Text style={s.chatItemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.chatItemTime}>{formatRelativeTime(item.last_message_time)}</Text>
        </View>
        {isActive && <View style={s.chatItemDot} />}
      </TouchableOpacity>
    );
  }, [currentChatId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>

      {/* Dimmed backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[s.backdrop, { opacity: dimAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sliding drawer */}
      <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}>

        {/* Brand and profile button */}
        <View style={s.drawerHeader}>
          <Text style={s.drawerBrand}>Amanda</Text>
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => setShowProfile(true)}
            activeOpacity={0.7}
          >
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {userEmail ? userEmail[0].toUpperCase() : '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* New chat button */}
        <TouchableOpacity style={s.newChatBtn} onPress={handleNewChat} activeOpacity={0.85}>
          <Text style={s.newChatIcon}>＋</Text>
          <Text style={s.newChatText}>New Chat</Text>
        </TouchableOpacity>

        <Text style={s.listHeading}>Recent</Text>

        {/* Chat list — loading, empty, or populated */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="small" color={C.bg3} />
          </View>
        ) : chats.length === 0 ? (
          <Text style={s.emptyText}>No chats yet. Start a new one!</Text>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={item => String(item.id)}
            renderItem={renderChat}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}

        {/* Profile panel — only mounted when open */}
        {showProfile && (
          <ProfilePanel
            onClose={() => setShowProfile(false)}
            onCloseSidebar={onClose}
            userEmail={userEmail}
            aiModel={aiModel}
            onSignOut={handleSignOut}
          />
        )}

      </Animated.View>
    </Modal>
  );
}