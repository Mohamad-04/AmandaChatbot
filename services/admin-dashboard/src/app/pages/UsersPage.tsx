import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  email: string;
  join_date: string;
  total_chats: number;
  last_active: string | null;
  is_admin: boolean;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "admin" && user.is_admin) ||
      (filterType === "verified" && !user.is_admin);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 style={{ fontFamily: 'Lexend Deca' }}>Users</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor user accounts</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full bg-input-background backdrop-blur-sm border-border"
          />
        </div>
        <div className="flex gap-2">
          {["all", "verified", "admin"].map(f => (
            <Button key={f} variant={filterType === f ? "default" : "outline"}
              onClick={() => setFilterType(f)} className="rounded-full capitalize">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Join Date</th>
                <th className="text-left p-4 font-medium">Total Chats</th>
                <th className="text-left p-4 font-medium">Last Active</th>
                <th className="text-left p-4 font-medium">Role</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading users…</td>
                </tr>
              ) : filteredUsers.map((user, index) => (
                <tr key={user.id}
                  className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${index === filteredUsers.length - 1 ? "border-b-0" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium">
                        {user.email.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(user.join_date).toLocaleDateString()}</td>
                  <td className="p-4">{user.total_chats}</td>
                  <td className="p-4 text-muted-foreground">{relativeTime(user.last_active)}</td>
                  <td className="p-4">
                    {user.is_admin && (
                      <Badge className="rounded-full bg-primary/20 text-primary border-primary/30">Admin</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-full"
                      onClick={() => navigate(`/conversations?user_id=${user.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />View Chats
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No users found matching your criteria.</div>
      )}
    </div>
  );
}
