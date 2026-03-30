// =============================================================================
// BACKEND INTEGRATION — OverviewPage
// =============================================================================
// All data below is currently hardcoded (fake). Replace with API calls.
//
// Suggested endpoint:  GET /api/admin/overview
// Auth:                Admin-only (check is_admin on the session/token)
//
// Expected JSON response shape:
// {
//   "stats": {
//     "total_users":          <int>   -- COUNT(*) FROM users
//     "active_today":         <int>   -- COUNT(*) FROM users WHERE last_active_at >= today (needs last_active_at column on users)
//     "total_conversations":  <int>   -- COUNT(*) FROM conversations
//     "risk_alerts":          <int>   -- COUNT(*) FROM risk_alerts WHERE resolved = false (needs a risk_alerts table, see RiskAlertsPage)
//   },
//   "new_users_over_time": [          -- GROUP BY day for last 30 days
//     { "date": "Mar 1", "users": 45 },
//     ...
//   ],
//   "message_breakdown": {
//     "user_messages":    <int>,      -- COUNT(*) FROM messages WHERE sender = 'user'
//     "amanda_messages":  <int>       -- COUNT(*) FROM messages WHERE sender = 'amanda'
//   },
//   "daily_conversations": [          -- GROUP BY day for last 14 days
//     { "day": "Mon", "conversations": 234 },
//     ...
//   ]
// }
//
// DB tables needed:
//   users          — id, email, is_admin, is_verified, created_at, last_active_at
//   conversations  — id, user_id, title, created_at
//   messages       — id, conversation_id, content, sender ('user'|'amanda'), created_at
// =============================================================================

import { useState, useEffect } from "react";
import { StatCard } from "../components/StatCard";
import { Users, Activity, MessageSquare, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

declare global { interface Window { amandaLoaderDone?: boolean; } }

export function OverviewPage() {
  const [chartsReady, setChartsReady] = useState(!!window.amandaLoaderDone);

  useEffect(() => {
    if (window.amandaLoaderDone) return;
    const onReady = () => setChartsReady(true);
    window.addEventListener('amanda-ready', onReady);
    return () => window.removeEventListener('amanda-ready', onReady);
  }, []);

  // TODO: replace with fetch('/api/admin/overview') and store in state
  const newUsersData = [
    { date: "Mar 1",  users: 45 },
    { date: "Mar 5",  users: 52 },
    { date: "Mar 9",  users: 48 },
    { date: "Mar 13", users: 61 },
    { date: "Mar 17", users: 70 },
    { date: "Mar 19", users: 78 },
  ];

  const conversationsData = [
    { day: "Mon", conversations: 234 },
    { day: "Tue", conversations: 287 },
    { day: "Wed", conversations: 256 },
    { day: "Thu", conversations: 312 },
    { day: "Fri", conversations: 298 },
    { day: "Sat", conversations: 178 },
    { day: "Sun", conversations: 156 },
    { day: "Mon", conversations: 245 },
    { day: "Tue", conversations: 289 },
    { day: "Wed", conversations: 267 },
    { day: "Thu", conversations: 324 },
    { day: "Fri", conversations: 301 },
    { day: "Sat", conversations: 189 },
    { day: "Sun", conversations: 167 },
  ];

  const messageBreakdownData = [
    { name: "User Messages",   value: 12483, color: "#A87A74" },
    { name: "Amanda Messages", value: 13256, color: "#C8A9A4" },
  ];

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 style={{ fontFamily: 'Lexend Deca' }}>Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back to your dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"         value="2,847" icon={Users}        change="+12.5% from last month" changeType="positive" />
        <StatCard title="Active Today"        value="342"   icon={Activity}      change="+8.3% from yesterday"  changeType="positive" />
        <StatCard title="Total Conversations" value="8,492" icon={MessageSquare} change="+15.2% from last month" changeType="positive" />
        <StatCard title="Risk Alerts"         value="23"    icon={AlertTriangle} change="4 new today" />
      </div>

      {chartsReady && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
              <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>New Users (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={newUsersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 122, 116, 0.2)" />
                  <XAxis dataKey="date" stroke="currentColor" style={{ fontSize: '12px' }} />
                  <YAxis stroke="currentColor" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="users" stroke="#A87A74" strokeWidth={3}
                    dot={{ fill: '#A87A74', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
              <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>Message Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={messageBreakdownData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {messageBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
            <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>Daily Conversations (Last 2 Weeks)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={conversationsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 122, 116, 0.2)" />
                <XAxis dataKey="day" stroke="currentColor" style={{ fontSize: '12px' }} />
                <YAxis stroke="currentColor" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="conversations" fill="#C8A9A4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
