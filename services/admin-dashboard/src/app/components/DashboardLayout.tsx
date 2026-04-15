import { Outlet, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface Activity {
  id: number;
  user: string;
  title: string;
  timestamp: string;
  preview: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function LiveConversationPanel() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/recent-activity", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recent Activity</h3>
        <Button variant="ghost" size="icon" className="rounded-full w-7 h-7" onClick={fetch_} aria-label="Refresh activity">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No activity in the last 24 hours.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/conversations?user_id=${encodeURIComponent(item.user)}`)}
              className="rounded-xl bg-card/80 backdrop-blur-sm border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm text-muted-foreground truncate flex-1 pr-2">{item.user}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.timestamp)}</span>
              </div>
              <p className="font-medium text-sm mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
