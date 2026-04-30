import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatCard({ title, value, icon: Icon, change, changeType = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card/80 backdrop-blur-md border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-semibold" style={{ fontFamily: 'Lexend Deca' }}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-2 ${
              changeType === "positive" ? "text-green-600 dark:text-green-400" :
              changeType === "negative" ? "text-red-600 dark:text-red-400" :
              "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
