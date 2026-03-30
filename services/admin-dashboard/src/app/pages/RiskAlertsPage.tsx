import { useState } from "react";
import { Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface RiskAlert {
  id: string;
  user: string;
  chatTitle: string;
  riskType: "suicidality" | "ipv" | "substance";
  severity: "low" | "medium" | "high";
  date: string;
}

export function RiskAlertsPage() {
  const [filterRiskType, setFilterRiskType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const alerts: RiskAlert[] = [
    { id: "1", user: "confidential-user-1@email.com", chatTitle: "Feeling hopeless",         riskType: "suicidality", severity: "high",   date: "2026-03-19" },
    { id: "2", user: "confidential-user-2@email.com", chatTitle: "Partner aggression",       riskType: "ipv",         severity: "high",   date: "2026-03-19" },
    { id: "3", user: "confidential-user-3@email.com", chatTitle: "Drinking concerns",        riskType: "substance",   severity: "medium", date: "2026-03-18" },
    { id: "4", user: "confidential-user-4@email.com", chatTitle: "Safety concerns",          riskType: "ipv",         severity: "high",   date: "2026-03-18" },
    { id: "5", user: "confidential-user-5@email.com", chatTitle: "Dark thoughts",            riskType: "suicidality", severity: "medium", date: "2026-03-17" },
    { id: "6", user: "confidential-user-6@email.com", chatTitle: "Substance use escalating", riskType: "substance",   severity: "medium", date: "2026-03-17" },
    { id: "7", user: "confidential-user-7@email.com", chatTitle: "Relationship violence",    riskType: "ipv",         severity: "high",   date: "2026-03-16" },
    { id: "8", user: "confidential-user-8@email.com", chatTitle: "Emotional distress",       riskType: "suicidality", severity: "low",    date: "2026-03-16" },
  ];

  const riskTypeData = [
    { type: "Suicidality", count: 12, color: "#6b3e38" },
    { type: "IPV",         count: 8,  color: "#A87A74" },
    { type: "Substance",   count: 3,  color: "#C8A9A4" },
  ];

  const severityTrendData = [
    { day: "Mar 13", low: 2, medium: 4, high: 1 },
    { day: "Mar 14", low: 1, medium: 3, high: 2 },
    { day: "Mar 15", low: 3, medium: 2, high: 1 },
    { day: "Mar 16", low: 2, medium: 5, high: 3 },
    { day: "Mar 17", low: 1, medium: 4, high: 2 },
    { day: "Mar 18", low: 2, medium: 3, high: 4 },
    { day: "Mar 19", low: 1, medium: 2, high: 4 },
  ];

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
  };

  const filteredAlerts = alerts.filter(a =>
    (filterRiskType === "all" || a.riskType === filterRiskType) &&
    (filterSeverity === "all" || a.severity === filterSeverity)
  );

  const severityColour = (s: string) =>
    s === "high"   ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" :
    s === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" :
                     "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";

  const riskLabel = (t: string) =>
    t === "suicidality" ? "Suicidality" :
    t === "ipv"         ? "Intimate Partner Violence" :
    t === "substance"   ? "Substance Abuse" : t;

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 style={{ fontFamily: 'Lexend Deca' }}>Risk Alerts</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage flagged conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
          <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>Risk Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                label={(e) => `${e.type}: ${e.count}`}>
                {riskTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm">
          <h3 className="mb-4" style={{ fontFamily: 'Lexend Deca' }}>Severity Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 122, 116, 0.2)" />
              <XAxis dataKey="day" stroke="currentColor" style={{ fontSize: '12px' }} />
              <YAxis stroke="currentColor" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="low"    stackId="a" fill="#86efac" name="Low"    />
              <Bar dataKey="medium" stackId="a" fill="#fbbf24" name="Medium" />
              <Bar dataKey="high"   stackId="a" fill="#ef4444" name="High" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Risk Type:</span>
          {["all", "suicidality", "ipv", "substance"].map(f => (
            <Button key={f} variant={filterRiskType === f ? "default" : "outline"}
              onClick={() => setFilterRiskType(f)} size="sm" className="rounded-full capitalize">
              {f === "ipv" ? "IPV" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Severity:</span>
          {["all", "low", "medium", "high"].map(f => (
            <Button key={f} variant={filterSeverity === f ? "default" : "outline"}
              onClick={() => setFilterSeverity(f)} size="sm" className="rounded-full capitalize">
              {f.charAt(0).toUpperCase() + f.slice(1)}
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
                <th className="text-left p-4 font-medium">Chat Title</th>
                <th className="text-left p-4 font-medium">Risk Type</th>
                <th className="text-left p-4 font-medium">Severity</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert, index) => (
                <tr key={alert.id}
                  className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${index === filteredAlerts.length - 1 ? "border-b-0" : ""}`}>
                  <td className="p-4 font-mono text-sm">{alert.user}</td>
                  <td className="p-4">{alert.chatTitle}</td>
                  <td className="p-4">
                    <Badge className="rounded-full bg-primary/20 text-primary border-primary/30">
                      {riskLabel(alert.riskType)}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={`rounded-full ${severityColour(alert.severity)}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(alert.date).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Eye className="w-4 h-4 mr-2" />View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No alerts found matching your criteria.</div>
      )}
    </div>
  );
}
