import { Moon, Sun, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onToggleRightPanel: () => void;
  isRightPanelOpen: boolean;
}

export function TopBar({ onToggleRightPanel, isRightPanelOpen }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg" style={{ fontFamily: 'Lexend Deca' }}>
          Good morning, Admin
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightPanel}
          className="rounded-full"
        >
          {isRightPanelOpen
            ? <PanelRightClose className="h-5 w-5" />
            : <PanelRightOpen  className="h-5 w-5" />
          }
        </Button>

        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@amanda.ai</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
