import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { UploadCard } from "@/components/UploadCard";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const N8N_WEBHOOK_URL = "https://sabaf16417.app.n8n.cloud/webhook/Generate-Prep-Brief";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/settings";
import { saveBrief } from "@/lib/history";
import { PrepBrief, SavedBrief } from "@/lib/types";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [jd, setJd] = useState("");
  const [jdName, setJdName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    resume.trim().length > 50 &&
    jd.trim().length > 50 &&
    isValidEmail(email) &&
    !loading;

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const settings = getSettings();
      const { data, error } = await supabase.functions.invoke("generate-brief", {
        body: {
          resume,
          jobDescription: jd,
          userApiKey: settings.apiKey || undefined,
          userProvider: settings.apiKey ? settings.provider : undefined,
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const brief = (data as { brief: PrepBrief }).brief;
      const id = crypto.randomUUID();
      const saved: SavedBrief = {
        id,
        createdAt: new Date().toISOString(),
        title: brief.role + (brief.company ? ` · ${brief.company}` : ""),
        brief,
        resumePreview: resume.slice(0, 200),
        jdPreview: jd.slice(0, 200),
      };
      saveBrief(saved);

      // Fire-and-forward to n8n webhook (don't block navigation on failure)
      try {
        if (!N8N_WEBHOOK_URL.startsWith("PASTE_")) {
          const briefText = JSON.stringify(brief, null, 2);
          const res = await fetch("https://sabaf16417.app.n8n.cloud/webhook/Generate-Prep-Brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail: email, generatedBrief: briefText }),
          });
          if (res.ok) {
            toast.success("Brief sent to your email!");
          } else {
            toast.error("Could not send email. Brief is saved.");
          }
        } else {
          console.warn("N8N webhook URL not configured.");
        }
      } catch (webhookErr) {
        console.error("Webhook error:", webhookErr);
        toast.error("Email delivery failed. Brief is saved.");
      }

      navigate(`/brief/${id}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate brief");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <LoadingScreen />
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
              Walk in ready. Walk out hired.
            </h1>
            <p className="text-primary-foreground/85 text-lg">
              Upload your resume and the job description. Get a personalized 1-page prep brief in seconds —
              tailored questions, draft answers, and gaps to address.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <UploadCard
            label="Your Resume"
            description="PDF, DOCX, DOC, TXT — or paste plain text"
            value={resume}
            onChange={setResume}
            fileName={resumeName}
            onFileNameChange={setResumeName}
            placeholder="Paste your resume contents here…"
          />
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

        <div className="mt-8 max-w-md mx-auto space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Your email (to receive the brief)
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
                Generating…
              </>
            ) : (
              <>
                Generate Prep Brief
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          {!canSubmit && !loading && (
            <p className="text-xs text-muted-foreground">
              Add your resume, the job description, and a valid email to continue.
            </p>
          )}
        </div>
      </main>
    </>
  );
};

export default Index;
