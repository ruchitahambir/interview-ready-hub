import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBatch } from "@/lib/history";
import { ArrowRight, Plus, Trophy, XCircle } from "lucide-react";

const colorChip = (c: "green" | "amber" | "red") => {
  if (c === "green") return "bg-emerald-600 text-white";
  if (c === "amber") return "bg-amber-500 text-white";
  return "bg-red-600 text-white";
};

const Batch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const batch = id ? getBatch(id) : undefined;

  if (!batch) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Batch not found</h2>
          <p className="text-muted-foreground mb-6">It may have been deleted or never existed.</p>
          <Button onClick={() => navigate("/")}>Start a new screening</Button>
        </div>
      </>
    );
  }

  // Sort: success first (by match score desc), errors last
  const ranked = [...batch.candidates].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return (b.matchScore || 0) - (a.matchScore || 0);
  });

  return (
    <>
      <AppHeader />
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Ranked Candidates</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {batch.jobTitle || "Candidate Screening"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {batch.candidates.length} candidate{batch.candidates.length !== 1 ? "s" : ""} · {new Date(batch.createdAt).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Plus className="w-4 h-4 mr-1.5" /> New screening
          </Button>
        </div>

        {batch.skillWeights.length > 0 && (
          <div className="card-soft p-4 mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Applied skill weights
            </p>
            <div className="flex flex-wrap gap-1.5">
              {batch.skillWeights.map((s, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={s.mustHave ? "bg-destructive/10 text-destructive border-destructive/30" : ""}
                >
                  {s.skill}
                  <span className="ml-1 opacity-70">{s.mustHave ? "must" : `×${s.weight}`}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <ol className="space-y-3">
          {ranked.map((c, idx) => (
            <li
              key={c.briefId}
              className={`card-soft p-4 flex items-center gap-4 ${
                c.error ? "opacity-70" : "hover:shadow-md transition-shadow cursor-pointer"
              }`}
              onClick={() => !c.error && navigate(`/brief/${c.briefId}`)}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary font-bold text-lg shrink-0">
                {c.error ? <XCircle className="w-5 h-5 text-destructive" /> : idx === 0 ? <Trophy className="w-5 h-5 text-amber-500" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{c.candidateName}</p>
                {c.error ? (
                  <p className="text-xs text-destructive mt-0.5">{c.error}</p>
                ) : (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={colorChip(c.color)}>Match {c.matchScore}/100</Badge>
                    <Badge variant="outline">Fit {c.fitScore}/10</Badge>
                  </div>
                )}
              </div>
              {!c.error && <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />}
            </li>
          ))}
        </ol>
      </main>
    </>
  );
};

export default Batch;
