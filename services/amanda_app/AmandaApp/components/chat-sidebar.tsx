// Sliding drawer that lists the user's chat history.
// Lets the user switch between chats, start a new one, and access their profile.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  TouchableWithoutFeedback, FlatList, ActivityIndicator, TextInput, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/use-auth';
import { useThemeContext, useThemeColors } from '../contexts/theme-context';
import { listChats } from '../services/api-client';
import { sidebarStyles as s, SIDEBAR_WIDTH } from '../styles/chat-sidebar.styles';
import ProfilePanel from './profile-panel';

const PROFILE_KEY = '@amanda_profile';

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

  const [chats,        setChats]       = useState<Chat[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [showProfile,  setShowProfile] = useState(false);
  const [searchQuery,  setSearchQuery] = useState('');
  const [displayName,  setDisplayName] = useState('');
  const { isDark, toggleTheme } = useThemeContext();
  const tc = useThemeColors();

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

    if (!visible) { setShowProfile(false); setSearchQuery(''); }
  }, [visible]);

  const filteredChats = searchQuery.trim()
    ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  // Fetches the chat list and profile name every time the sidebar opens
  useEffect(() => {
    if (visible) {
      loadChats();
      AsyncStorage.getItem(PROFILE_KEY).then(val => {
        if (val) {
          const p = JSON.parse(val);
          const first = (p.firstName || '').trim();
          const last  = (p.lastName  || '').trim();
          setDisplayName(first && last ? `${first} ${last}` : first || '');
        }
      }).catch(() => {});
    }
  }, [visible]);

  // Loads all chats for the logged-in user from the backend
  async function loadChats() {
    setLoading(true);
    try {
      const data = await listChats() as any;
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
        style={[s.chatItem, isActive && s.chatItemActive, { borderBottomColor: isDark ? 'rgba(168,122,116,0.06)' : 'rgba(168,122,116,0.08)' }]}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        <View style={s.chatItemInner}>
          <Text style={[s.chatItemTitle, { color: tc.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[s.chatItemTime, { color: tc.textLight }]}>{formatRelativeTime(item.last_message_time)}</Text>
        </View>
        {isActive && <View style={s.chatItemDot} />}
      </TouchableOpacity>
    );
  }, [currentChatId, isDark, tc]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>

      {/* Dimmed backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[s.backdrop, { opacity: dimAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sliding drawer */}
      <Animated.View style={[s.drawer, { transform: [{ translateX: slideAnim }], backgroundColor: isDark ? '#2C1E1A' : '#E8D5CC' }]}>

        {/* Brand + theme toggle */}
        <View style={[s.drawerHeader, { borderBottomColor: tc.border }]}>
          <Text style={[s.drawerBrand, { color: tc.text }]}>Amanda</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: 'rgba(168,122,116,0.30)', true: '#2d1e1c' }}
            thumbColor={isDark ? '#C9A29D' : '#ffffff'}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        </View>

        {/* Search bar */}
        <View style={[s.searchBar, { borderColor: tc.border, backgroundColor: isDark ? 'rgba(168,122,116,0.08)' : 'rgba(168,122,116,0.10)' }]}>
          <Feather name="search" size={15} color={tc.textLight} />
          <TextInput
            style={[s.searchInput, { color: tc.text }]}
            placeholder="Search chats…"
            placeholderTextColor={tc.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[s.searchClear, { color: tc.textLight }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* New chat button */}
        <TouchableOpacity
          style={[s.newChatBtn, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : tc.text,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'transparent',
          }]}
          onPress={handleNewChat}
          activeOpacity={0.85}
        >
          <Text style={[s.newChatIcon, { color: isDark ? 'rgba(255,255,255,0.88)' : 'white' }]}>＋</Text>
          <Text style={[s.newChatText, { color: isDark ? 'rgba(255,255,255,0.88)' : 'white' }]}>New Chat</Text>
        </TouchableOpacity>

        <Text style={[s.listHeading, { color: tc.textLight }]}>Recent</Text>

        {/* Chat list — flex: 1 so it fills remaining space and footer sticks to bottom */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="small" color={tc.primary} />
            </View>
          ) : filteredChats.length === 0 ? (
            <Text style={[s.emptyText, { color: tc.textMuted }]}>
              {searchQuery.trim() ? 'No chats match your search.' : 'No chats yet. Start a new one!'}
            </Text>
          ) : (
            <FlatList
              data={filteredChats}
              keyExtractor={item => String(item.id)}
              renderItem={renderChat}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>

        {/* Profile footer — avatar + email, taps to open profile panel */}
        <TouchableOpacity
          style={[s.profileFooter, { borderTopColor: tc.border }]}
          onPress={() => setShowProfile(true)}
          activeOpacity={0.7}
        >
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>
              {displayName ? displayName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={[s.profileEmail, { color: tc.text }]} numberOfLines={1}>
            {displayName || userEmail || 'Account'}
          </Text>
        </TouchableOpacity>

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