// =============================================================================
// BACKEND INTEGRATION — ConversationsPage
// =============================================================================
// All conversation/message data below is currently hardcoded (fake). Replace with API calls.
//
// ── Conversation list ────────────────────────────────────────────────────────
// Suggested endpoint:  GET /api/admin/conversations?user_id=<optional>
// Auth:                Admin-only
//
// Expected JSON response shape (array):
// [
//   {
//     "id":            <int>,
//     "user":          <string email>,   -- JOIN users ON conversations.user_id = users.id
//     "title":         <string>,         -- conversations.title (first message content or auto-generated)
//     "date":          <string ISO date>,-- conversations.created_at
//     "message_count": <int>             -- COUNT(*) FROM messages WHERE conversation_id = conversations.id
//   },
//   ...
// ]
//
// ── Individual conversation messages ─────────────────────────────────────────
// Suggested endpoint:  GET /api/admin/conversations/<id>/messages
// Auth:                Admin-only
//
// Expected JSON response shape (array):
// [
//   {
//     "id":        <int>,
//     "content":   <string>,
//     "sender":    "user" | "amanda",   -- messages.sender (or derive from role column)
//     "timestamp": <string>             -- messages.created_at (formatted as "10:23 AM" or raw for frontend to format)
//   },
//   ...
// ]
//
// ── Auto-refresh (Switch toggle, line ~68) ───────────────────────────────────
// When autoRefresh is true, poll GET /api/admin/conversations every N seconds
// (suggested interval: 15–30s). Use setInterval in a useEffect.
//
// DB tables needed:
//   users          — id, email
//   conversations  — id, user_id, title, created_at
//   messages       — id, conversation_id, content, sender ('user'|'amanda'), created_at
// =============================================================================

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  content: string;
  sender: "user" | "amanda";
  timestamp: string;
}

interface Chat {
  id: string;
  user: string;
  title: string;
  date: string;
  messageCount: number;
  messages: Message[];
}

export function ConversationsPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState("1");

  // TODO: replace with fetch('/api/admin/conversations') and store in state
  // TODO: on selectedChatId change, fetch('/api/admin/conversations/<id>/messages')
  const chats: Chat[] = [
    {
      id: "1", user: "sarah.johnson@email.com", title: "Relationship conflict resolution",
      date: "2026-03-19", messageCount: 28,
      messages: [
        { id: "1", content: "I've been having some issues with my partner lately. We seem to be arguing more frequently.", sender: "user", timestamp: "10:23 AM" },
        { id: "2", content: "I understand that increased conflict can be challenging. Can you tell me more about what these arguments are typically about?", sender: "amanda", timestamp: "10:23 AM" },
        { id: "3", content: "It's usually about small things that escalate. Like household chores or how we spend our free time together.", sender: "user", timestamp: "10:25 AM" },
        { id: "4", content: "It sounds like these day-to-day topics might be touching on deeper concerns about fairness and quality time. Have you noticed any patterns in when these conflicts happen?", sender: "amanda", timestamp: "10:26 AM" },
        { id: "5", content: "Now that you mention it, they tend to happen more when we're both stressed from work.", sender: "user", timestamp: "10:28 AM" },
      ],
    },
    {
      id: "2", user: "mike.rodriguez@email.com", title: "Communication breakdown",
      date: "2026-03-18", messageCount: 15,
      messages: [
        { id: "1", content: "My partner and I aren't communicating well anymore.", sender: "user", timestamp: "2:15 PM" },
        { id: "2", content: "I'm here to help. What makes you feel like the communication has broken down?", sender: "amanda", timestamp: "2:15 PM" },
      ],
    },
    {
      id: "3", user: "emma.kim@email.com", title: "Trust and boundaries",
      date: "2026-03-18", messageCount: 32,
      messages: [
        { id: "1", content: "I'm struggling with trust issues in my relationship.", sender: "user", timestamp: "4:30 PM" },
        { id: "2", content: "Trust is fundamental in relationships. Would you like to share what's been challenging your trust?", sender: "amanda", timestamp: "4:30 PM" },
      ],
    },
  ];

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="space-y-6 h-full flex flex-col max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Lexend Deca' }}>Conversations</h1>
          <p className="text-muted-foreground mt-1">Monitor ongoing conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="auto-refresh" className="cursor-pointer">Auto-refresh</Label>
          <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <Button variant="outline" size="icon" className="rounded-full">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-80 rounded-xl bg-card/80 backdrop-blur-md border border-border p-4 overflow-y-auto space-y-2">
          <h3 className="font-semibold mb-3">Recent Chats</h3>
          {chats.map((chat) => (
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
                <span>{chat.messageCount} messages</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 overflow-y-auto">
          {selectedChat ? (
            <>
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="font-semibold mb-1" style={{ fontFamily: 'Lexend Deca' }}>
                  {selectedChat.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedChat.user}</span>
                  <span>&bull;</span>
                  <span>{selectedChat.messageCount} messages</span>
                  <span>&bull;</span>
                  <span>{new Date(selectedChat.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedChat.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-[#DDD0C4] text-[#3a2720] dark:bg-[#C8A9A4] dark:text-[#1C1A1C]"
                        : "bg-[#A87A74] text-white dark:bg-[#6B5048] dark:text-[#f5e6df]"
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
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
