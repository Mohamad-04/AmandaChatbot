// =============================================================================
// BACKEND INTEGRATION — UsersPage
// =============================================================================
// All user data below is currently hardcoded (fake). Replace with API calls.
//
// Suggested endpoint:  GET /api/admin/users?search=<email>&filter=<all|admin|verified>
// Auth:                Admin-only
//
// Expected JSON response shape (array):
// [
//   {
//     "id":          <int>,
//     "email":       <string>,
//     "join_date":   <string ISO date>,  -- users.created_at
//     "total_chats": <int>,              -- COUNT(*) FROM conversations WHERE user_id = users.id
//     "last_active": <string>,           -- users.last_active_at (formatted as relative time on backend, or raw datetime to format on frontend)
//     "is_admin":    <bool>              -- users.is_admin
//   },
//   ...
// ]
//
// DB tables needed:
//   users          — id, email, is_admin, is_verified, created_at, last_active_at
//   conversations  — id, user_id  (for the total_chats count JOIN)
//
// "View Chats" button (Eye icon, line 102) should link to ConversationsPage
// filtered by this user's ID. Suggested: navigate to /conversations?user_id=<id>
// which requires GET /api/admin/conversations?user_id=<id> (see ConversationsPage).
// =============================================================================

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  joinDate: string;
  totalChats: number;
  lastActive: string;
  isAdmin: boolean;
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // TODO: replace with fetch('/api/admin/users') and store in state
  const users: User[] = [
    { id: "1", email: "sarah.johnson@email.com",  joinDate: "2026-01-15", totalChats: 23, lastActive: "2 hours ago",  isAdmin: false },
    { id: "2", email: "mike.rodriguez@email.com", joinDate: "2026-02-03", totalChats: 18, lastActive: "5 hours ago",  isAdmin: false },
    { id: "3", email: "emma.kim@email.com",        joinDate: "2025-12-20", totalChats: 45, lastActive: "1 day ago",    isAdmin: false },
    { id: "4", email: "admin@amanda.ai",           joinDate: "2025-11-01", totalChats: 0,  lastActive: "Just now",     isAdmin: true  },
    { id: "5", email: "alex.martinez@email.com",  joinDate: "2026-01-28", totalChats: 31, lastActive: "3 hours ago",  isAdmin: false },
    { id: "6", email: "lisa.patel@email.com",      joinDate: "2026-02-14", totalChats: 12, lastActive: "1 hour ago",   isAdmin: false },
    { id: "7", email: "james.wilson@email.com",    joinDate: "2026-03-01", totalChats: 8,  lastActive: "4 hours ago",  isAdmin: false },
    { id: "8", email: "sophia.chen@email.com",     joinDate: "2026-01-10", totalChats: 27, lastActive: "6 hours ago",  isAdmin: false },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "admin" && user.isAdmin) ||
      (filterType === "verified" && !user.isAdmin);
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
              {filteredUsers.map((user, index) => (
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
                  <td className="p-4 text-muted-foreground">{new Date(user.joinDate).toLocaleDateString()}</td>
                  <td className="p-4">{user.totalChats}</td>
                  <td className="p-4 text-muted-foreground">{user.lastActive}</td>
                  <td className="p-4">
                    {user.isAdmin && (
                      <Badge className="rounded-full bg-primary/20 text-primary border-primary/30">Admin</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Eye className="w-4 h-4 mr-2" />View Chats
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No users found matching your criteria.</div>
      )}
    </div>
  );
}
