import { useState, useEffect } from "react";
import { StatCard } from "../components/StatCard";
import { Users, Activity, MessageSquare, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

declare global { interface Window { amandaLoaderDone?: boolean; } }

interface OverviewData {
  stats: {
    total_users: number;
    active_today: number;
    total_conversations: number;
    risk_alerts: number;
  };
  new_users_over_time: { date: string; users: number }[];
  message_breakdown: { user_messages: number; amanda_messages: number };
  daily_conversations: { day: string; conversations: number }[];
}

export function OverviewPage() {
  const [chartsReady, setChartsReady] = useState(!!window.amandaLoaderDone);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.amandaLoaderDone) return;
    const onReady = () => setChartsReady(true);
    window.addEventListener('amanda-ready', onReady);
    return () => window.removeEventListener('amanda-ready', onReady);
  }, []);

  useEffect(() => {
    fetch('/api/admin/overview', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const messageBreakdownData = data ? [
    { name: "User Messages",   value: data.message_breakdown.user_messages,   color: "#A87A74" },
    { name: "Amanda Messages", value: data.message_breakdown.amanda_messages, color: "#C8A9A4" },
  ] : [];

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
  };

  const val = (n: number | undefined) => loading ? "—" : String(n ?? 0);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 style={{ fontFamily: 'Lexend Deca' }}>Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back to your dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"         value={val(data?.stats.total_users)}         icon={Users}         change="" changeType="positive" />
        <StatCard title="Active Today"        value={val(data?.stats.active_today)}        icon={Activity}      change="" changeType="positive" />
        <StatCard title="Total Conversations" value={val(data?.stats.total_conversations)} icon={MessageSquare} change="" changeType="positive" />
        <StatCard title="Risk Alerts"         value={val(data?.stats.risk_alerts)}         icon={AlertTriangle} change="" />
      </div>

      {chartsReady && data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
              <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>New Users (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.new_users_over_time}>
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
              <BarChart data={data.daily_conversations}>
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
