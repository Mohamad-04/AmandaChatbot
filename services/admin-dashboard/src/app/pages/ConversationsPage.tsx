import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  id: number;
  content: string;
  sender: "user" | "amanda";
  timestamp: string;
}

interface Chat {
  id: number;
  user: string;
  title: string;
  date: string;
  message_count: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ConversationsPage() {
  const [searchParams] = useSearchParams();
  const userIdFilter = searchParams.get('user_id');

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChats = useCallback(() => {
    const url = userIdFilter
      ? `/api/admin/conversations?user_id=${userIdFilter}`
      : '/api/admin/conversations';
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setChats(d);
        setLoadingChats(false);
        if (d.length > 0 && selectedChatId === null) {
          setSelectedChatId(d[0].id);
        }
      })
      .catch(() => setLoadingChats(false));
  }, [userIdFilter, selectedChatId]);

  useEffect(() => {
    fetchChats();
  }, [userIdFilter]);

  useEffect(() => {
    if (selectedChatId === null) return;
    setLoadingMessages(true);
    fetch(`/api/admin/conversations/${selectedChatId}/messages`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMessages(d); setLoadingMessages(false); })
      .catch(() => setLoadingMessages(false));
  }, [selectedChatId]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchChats, 20000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchChats]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="space-y-6 h-full flex flex-col max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Lexend Deca' }}>Conversations</h1>
          <p className="text-muted-foreground mt-1">
            {userIdFilter ? `Showing chats for user #${userIdFilter}` : "Monitor ongoing conversations"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="auto-refresh" className="cursor-pointer">Auto-refresh</Label>
          <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <Button variant="outline" size="icon" className="rounded-full" onClick={fetchChats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Chat list */}
        <div className="w-80 rounded-xl bg-card/80 backdrop-blur-md border border-border p-4 overflow-y-auto space-y-2">
          <h3 className="font-semibold mb-3">Recent Chats</h3>
          {loadingChats ? (
            <p className="text-muted-foreground text-sm text-center py-6">Loading…</p>
          ) : chats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No conversations found.</p>
          ) : chats.map((chat) => (
            <div key={chat.id} onClick={() => setSelectedChatId(chat.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedChatId === chat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/50 hover:bg-accent/50"
              }`}>
              <p className="text-sm opacity-90 mb-1">{chat.user}</p>
              <p className="font-medium mb-2">{chat.title}</p>
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>{new Date(chat.date).toLocaleDateString()}</span>
                <span>{chat.message_count} messages</span>
              </div>
            </div>
          ))}
        </div>

        {/* Message view */}
        <div className="flex-1 rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 overflow-y-auto">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">Loading messages…</div>
          ) : selectedChat ? (
            <>
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="font-semibold mb-1" style={{ fontFamily: 'Lexend Deca' }}>
                  {selectedChat.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedChat.user}</span>
                  <span>&bull;</span>
                  <span>{selectedChat.message_count} messages</span>
                  <span>&bull;</span>
                  <span>{new Date(selectedChat.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-[#DDD0C4] text-[#3a2720] dark:bg-[#C8A9A4] dark:text-[#1C1A1C]"
                        : "bg-[#A87A74] text-white dark:bg-[#6B5048] dark:text-[#f5e6df]"
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs mt-2 opacity-70">{formatTime(message.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a conversation to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
