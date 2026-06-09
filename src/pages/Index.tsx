import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { UploadCard } from "@/components/UploadCard";
import { BatchUploadCard, CandidateFile } from "@/components/BatchUploadCard";
import { SkillWeights } from "@/components/SkillWeights";
import { BatchProgress, BatchProgressItem } from "@/components/BatchProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const N8N_WEBHOOK_URL = "https://sabaf16417.app.n8n.cloud/webhook/Generate-Prep-Brief";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/settings";
import { saveBrief, saveBatch } from "@/lib/history";
import { PrepBrief, SavedBrief, SavedBatch, SkillWeight, BatchCandidate } from "@/lib/types";
import { toast } from "sonner";

const CONCURRENCY = 4;

const Index = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateFile[]>([]);
  const [jd, setJd] = useState("");
  const [jdName, setJdName] = useState("");
  const [email, setEmail] = useState("");
  const [skillWeights, setSkillWeights] = useState<SkillWeight[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BatchProgressItem[]>([]);

  const validCandidates = candidates.filter((c) => c.text.trim().length > 50);
  const canSubmit =
    validCandidates.length > 0 &&
    jd.trim().length > 50 &&
    isValidEmail(email) &&
    !loading;

  const processCandidate = async (
    cand: CandidateFile,
    settings: ReturnType<typeof getSettings>,
  ): Promise<{ brief?: PrepBrief; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-brief", {
        body: {
          resume: cand.text,
          jobDescription: jd,
          skillWeights,
          userApiKey: settings.apiKey || undefined,
          userProvider: settings.apiKey ? settings.provider : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return { brief: (data as { brief: PrepBrief }).brief };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  };

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setLoading(true);

    const initial: BatchProgressItem[] = validCandidates.map((c) => ({
      name: c.name,
      status: "pending",
    }));
    setProgress(initial);

    const settings = getSettings();
    const results: { candidate: CandidateFile; brief?: PrepBrief; error?: string }[] =
      new Array(validCandidates.length);

    let cursor = 0;
    const worker = async () => {
      while (true) {
        const idx = cursor++;
        if (idx >= validCandidates.length) return;
        setProgress((prev) => {
          const next = prev.slice();
          next[idx] = { ...next[idx], status: "processing" };
          return next;
        });
        const cand = validCandidates[idx];
        const res = await processCandidate(cand, settings);
        results[idx] = { candidate: cand, ...res };
        setProgress((prev) => {
          const next = prev.slice();
          next[idx] = { ...next[idx], status: res.error ? "error" : "done" };
          return next;
        });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, validCandidates.length) }, () => worker()),
    );

    // Save each successful brief and build batch
    const batchId = crypto.randomUUID();
    const batchCandidates: BatchCandidate[] = [];
    let jobTitle = "";

    for (const r of results) {
      if (r.error || !r.brief) {
        batchCandidates.push({
          briefId: crypto.randomUUID(),
          candidateName: r.candidate.name,
          fitScore: 0,
          matchScore: 0,
          color: "red",
          error: r.error,
        });
        continue;
      }
      const briefId = crypto.randomUUID();
      const brief = r.brief;
      if (!jobTitle) jobTitle = brief.role + (brief.company ? ` · ${brief.company}` : "");
      const saved: SavedBrief = {
        id: briefId,
        createdAt: new Date().toISOString(),
        title: `${r.candidate.name} — ${brief.role}`,
        brief,
        resumePreview: r.candidate.text.slice(0, 200),
        jdPreview: jd.slice(0, 200),
        candidateName: r.candidate.name,
        batchId,
      };
      saveBrief(saved);
      batchCandidates.push({
        briefId,
        candidateName: r.candidate.name,
        fitScore: brief.fit_Score?.score ?? 0,
        matchScore: brief.match_score?.score ?? (brief.fit_Score ? brief.fit_Score.score * 10 : 0),
        color: brief.match_score?.color ?? brief.fit_Score?.color ?? "amber",
      });
    }

    const batch: SavedBatch = {
      id: batchId,
      createdAt: new Date().toISOString(),
      jobTitle: jobTitle || "Candidate Screening",
      jdPreview: jd.slice(0, 200),
      candidates: batchCandidates,
      skillWeights,
    };
    saveBatch(batch);

    // Fire-and-forward summary to n8n webhook
    try {
      if (!N8N_WEBHOOK_URL.startsWith("PASTE_")) {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: email,
            jobTitle: batch.jobTitle,
            candidates: batchCandidates,
            skillWeights,
          }),
        });
        toast.success("Ranking sent to your email!");
      }
    } catch (e) {
      console.error("Webhook error:", e);
    }

    navigate(`/batch/${batchId}`);
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <BatchProgress items={progress} />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="container max-w-6xl mx-auto px-4 py-10 md:py-16">
        <section className="hero-banner text-center mb-10 px-6 py-12 md:py-16">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-primary-foreground text-xs font-medium mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Your AI interview coach
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground mb-3">
              Filter the best talent in seconds.
            </h1>
            <p className="text-primary-foreground/85 text-lg">
              Stop spending 4 hours screening applications-Upload your resume and the job description. Get a personalized 1-page prep brief in seconds —
              tailored questions, draft answers, and gaps to address.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <BatchUploadCard candidates={candidates} onChange={setCandidates} />
          <UploadCard
            label="Job Description"
            description="Paste the JD or upload a file from the company"
            value={jd}
            onChange={setJd}
            fileName={jdName}
            onFileNameChange={setJdName}
            placeholder="Paste the job description here…"
          />
        </section>

        <section className="mt-5">
          <SkillWeights value={skillWeights} onChange={setSkillWeights} />
        </section>

        <div className="mt-8 max-w-md mx-auto space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Your email (to receive the ranking)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleGenerate}
            className="btn-gradient text-base font-semibold px-8 h-12 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Screening…
              </>
            ) : (
              <>
                Rank {validCandidates.length > 0 ? validCandidates.length : ""} Candidate{validCandidates.length !== 1 ? "s" : ""}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          {!canSubmit && !loading && (
            <p className="text-xs text-muted-foreground">
              Add at least one resume, the job description, and a valid email to continue.
            </p>
          )}
        </div>
      </main>
    </>
  );
};

export default Index;
