import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BriefView } from "@/components/BriefView";
import { Button } from "@/components/ui/button";
import { getBrief } from "@/lib/history";
import { SavedBrief } from "@/lib/types";
import { Copy, Download, Printer, Plus } from "lucide-react";
import { toast } from "sonner";

const Brief = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedBrief | undefined>(() =>
    id ? getBrief(id) : undefined
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) setSaved(getBrief(id));
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading brief…
        </div>
      </>
    );
  }

  if (!saved) {
    return (
      <>
        <AppHeader />
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Brief not found</h2>
          <p className="text-muted-foreground mb-6">It may have been deleted or never existed.</p>
          <Button onClick={() => navigate("/")}>Create a new brief</Button>
        </div>
      </>
    );
  }

  const handleCopy = async () => {
    const b = saved.brief;
    const text = [
      `${b.role}${b.company ? " — " + b.company : ""}`,
      "",
      "SNAPSHOT",
      b.snapshot,
      "",
      "KEY TALKING POINTS",
      ...b.talking_points.map((p) => `• ${p}`),
      "",
      "QUESTION BANK",
      ...b.questions.map((q) => `[${q.priority.toUpperCase()}] ${q.question} (${q.category})`),
      "",
      "SUGGESTED ANSWERS",
      ...b.suggested_answers.flatMap((a) => [`Q: ${a.question}`, `A: ${a.answer}`, ""]),
      "RED FLAGS",
      ...b.red_flags.map((r) => `• ${r.gap} — ${r.how_to_address}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handlePdf = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.getElementById("brief-printable");
      if (!el) return;
      await html2pdf()
        .set({
          margin: 10,
          filename: `${saved.title.replace(/[^\w\s-]/g, "")}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();
    } catch (e) {
      toast.error("PDF export failed");
    }
  };

  return (
    <>
      <AppHeader />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
          <Button variant="outline" onClick={() => navigate("/")}>
            <Plus className="w-4 h-4 mr-1.5" /> New brief
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
            <Button className="btn-gradient" onClick={handlePdf}>
              <Download className="w-4 h-4 mr-1.5" /> Download PDF
            </Button>
          </div>
        </div>
        <BriefView brief={saved.brief} createdAt={saved.createdAt} />
      </main>
    </>
  );
};

export default Brief;
