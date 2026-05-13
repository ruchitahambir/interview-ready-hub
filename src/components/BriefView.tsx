import { PrepBrief } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, MessageSquare, Sparkles, Target, Gauge } from "lucide-react";

interface Props {
  brief: PrepBrief;
  createdAt?: string;
}

const priorityColor = (p: string) => {
  if (p === "high") return "bg-destructive/10 text-destructive border-destructive/20";
  if (p === "medium") return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-secondary text-muted-foreground border-border";
};

const fitScoreStyles = (color: "green" | "amber" | "red") => {
  switch (color) {
    case "green":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 [&>svg]:text-emerald-600";
    case "amber":
      return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 [&>svg]:text-amber-600";
    case "red":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 [&>svg]:text-red-600";
  }
};

const fitBadgeStyles = (color: "green" | "amber" | "red") => {
  switch (color) {
    case "green":
      return "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent";
    case "amber":
      return "bg-amber-500 hover:bg-amber-500 text-white border-transparent";
    case "red":
      return "bg-red-600 hover:bg-red-600 text-white border-transparent";
  }
};

export const BriefView = ({ brief, createdAt }: Props) => {
  return (
    <div id="brief-printable" className="space-y-6">
      {/* Header */}
      <div className="card-soft p-6 bg-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Interview Prep Brief</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {brief.role || "Your Role"}
            </h1>
            {brief.company && (
              <p className="text-muted-foreground mt-1">{brief.company}</p>
            )}
          </div>
          {createdAt && (
            <div className="text-xs text-muted-foreground">
              Generated {new Date(createdAt).toLocaleString()}
            </div>
          )}
        </div>
        <p className="mt-4 text-foreground leading-relaxed">{brief.snapshot}</p>
      </div>

      {/* Talking points */}
      <section className="card-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Sparkles className="w-5 h-5 text-primary" /> Key Talking Points
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {brief.talking_points.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm bg-accent/30 rounded-lg px-3 py-2">
              <span className="text-primary font-bold">›</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Question bank */}
      <section className="card-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Target className="w-5 h-5 text-primary" /> Question Bank
        </h2>
        <ul className="space-y-2">
          {brief.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-colors">
              <Badge variant="outline" className={`shrink-0 ${priorityColor(q.priority)} capitalize`}>
                {q.priority}
              </Badge>
              <div className="flex-1">
                <p className="text-foreground">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{q.category}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Suggested answers */}
      <section className="card-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <MessageSquare className="w-5 h-5 text-primary" /> Suggested Answers
        </h2>
        <Accordion type="multiple" className="w-full">
          {brief.suggested_answers.map((a, i) => (
            <AccordionItem key={i} value={`a-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {a.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground leading-relaxed whitespace-pre-line">
                {a.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Red flags */}
      <section className="card-soft p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <AlertTriangle className="w-5 h-5 text-warning" /> Red Flag Detector
        </h2>
        {brief.red_flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No major gaps detected — great alignment!</p>
        ) : (
          <ul className="space-y-3">
            {brief.red_flags.map((rf, i) => (
              <li key={i} className="border-l-4 border-warning pl-4 py-1">
                <p className="font-medium text-foreground text-sm">{rf.gap}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">How to address: </span>
                  {rf.how_to_address}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
