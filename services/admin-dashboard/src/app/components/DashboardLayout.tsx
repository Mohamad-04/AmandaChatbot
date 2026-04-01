import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useState } from "react";

export function DashboardLayout() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          isRightPanelOpen={isRightPanelOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>

          {isRightPanelOpen && (
            <aside className="w-80 border-l border-border bg-card/50 backdrop-blur-md overflow-y-auto p-4">
              <LiveConversationPanel />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveConversationPanel() {
  const recentMessages = [
    { id: 1, user: "sarah.j@email.com",  title: "Relationship conflict",  time: "2 mins ago",  preview: "I'm not sure how to handle this situation..." },
    { id: 2, user: "mike.r@email.com",   title: "Communication issues",   time: "5 mins ago",  preview: "We've been having trouble talking to each other..." },
    { id: 3, user: "emma.k@email.com",   title: "Trust concerns",         time: "12 mins ago", preview: "I feel like something has changed between us..." },
    { id: 4, user: "alex.m@email.com",   title: "Moving forward",         time: "18 mins ago", preview: "How do we rebuild after a difficult period?" },
    { id: 5, user: "lisa.p@email.com",   title: "Family dynamics",        time: "25 mins ago", preview: "His family doesn't seem to accept me..." },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recent Activity</h3>
      <div className="space-y-3">
        {recentMessages.map((message) => (
          <div
            key={message.id}
            className="rounded-xl bg-card/80 backdrop-blur-sm border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm text-muted-foreground truncate flex-1 pr-2">{message.user}</p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{message.time}</span>
            </div>
            <p className="font-medium text-sm mb-1">{message.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{message.preview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
