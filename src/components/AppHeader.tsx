import { Link, useLocation } from "react-router-dom";
import { Sparkles, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppHeader = () => {
  const loc = useLocation();
  const link = (to: string, label: string, Icon: React.ComponentType<{ className?: string }>) => (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        loc.pathname === to
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <header className="no-print border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
      <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-foreground">InterviewReady</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Coach · v1</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {link("/history", "History", History)}
          {link("/settings", "Settings", Settings)}
        </nav>
      </div>
    </header>
  );
};
