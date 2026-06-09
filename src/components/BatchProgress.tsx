import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type CandidateStatus = "pending" | "processing" | "done" | "error";

export interface BatchProgressItem {
  name: string;
  status: CandidateStatus;
}

interface Props {
  items: BatchProgressItem[];
}

export const BatchProgress = ({ items }: Props) => {
  const done = items.filter((i) => i.status === "done" || i.status === "error").length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <div className="card-soft p-8">
        <div className="w-16 h-16 rounded-2xl btn-gradient mx-auto flex items-center justify-center mb-5">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Screening candidates</h2>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Processing {items.length} resume{items.length !== 1 ? "s" : ""} concurrently…
        </p>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{done} of {items.length} complete</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>

        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 text-sm bg-secondary/40 rounded-md px-3 py-2">
              {it.status === "done" && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
              {it.status === "processing" && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
              {it.status === "error" && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
              {it.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />}
              <span className="truncate flex-1">{it.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{it.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
