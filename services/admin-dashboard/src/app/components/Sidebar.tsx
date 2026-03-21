import { NavLink } from "react-router";
import { LayoutDashboard, Users, MessageSquare, AlertTriangle, Settings } from "lucide-react";

export function Sidebar() {
  const navItems = [
    { to: "/",              label: "Overview",      icon: LayoutDashboard, end: true },
    { to: "/users",         label: "Users",         icon: Users },
    { to: "/conversations", label: "Conversations", icon: MessageSquare },
    { to: "/risk-alerts",   label: "Risk Alerts",   icon: AlertTriangle },
    { to: "/settings",      label: "Settings",      icon: Settings },
  ];

  return (
    <aside className="w-60 bg-sidebar backdrop-blur-md border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl tracking-tight" style={{ fontFamily: 'Lexend Deca' }}>
          Amanda
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
