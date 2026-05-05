import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const STAGES = [
  "Reading your resume…",
  "Understanding the role…",
  "Spotting strengths and gaps…",
  "Drafting your playbook…",
];

const TIPS = [
  "Tip: Use the STAR method — Situation, Task, Action, Result.",
  "Tip: Quantify impact with numbers wherever possible.",
  "Tip: Prepare 2–3 questions to ask the interviewer.",
  "Tip: Frame weaknesses as growth areas you're actively addressing.",
  "Tip: Mirror the language used in the job description.",
];

export const LoadingScreen = () => {
  const [stage, setStage] = useState(0);
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const i1 = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1800);
    const i2 = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 3500);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, []);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <div className="card-soft p-8 text-center">
        <div className="w-16 h-16 rounded-2xl btn-gradient mx-auto flex items-center justify-center mb-5">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Crafting your prep brief</h2>
        <p className="text-muted-foreground text-sm mb-8">This usually takes 15–30 seconds.</p>

        <ul className="space-y-3 text-left max-w-sm mx-auto">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-sm">
              {i < stage ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : i === stage ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-border" />
              )}
              <span className={i <= stage ? "text-foreground font-medium" : "text-muted-foreground"}>{s}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 p-4 bg-accent/40 rounded-xl text-sm text-accent-foreground">
          {TIPS[tip]}
        </div>
      </div>
    </div>
  );
};
