import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { listBriefs, deleteBrief } from "@/lib/history";
import { SavedBrief } from "@/lib/types";
import { FileText, Trash2, Plus, History as HistoryIcon } from "lucide-react";

const History = () => {
  const [items, setItems] = useState<SavedBrief[]>([]);

  useEffect(() => {
    setItems(listBriefs());
  }, []);

  const remove = (id: string) => {
    deleteBrief(id);
    setItems(listBriefs());
  };

  return (
    <>
      <AppHeader />
      <main className="container max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HistoryIcon className="w-6 h-6 text-primary" /> Your prep history
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saved on this device. Revisit any past playbook anytime.
            </p>
          </div>
          <Link to="/">
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-1.5" /> New brief
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card-soft p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No briefs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your first prep brief to see it here.
            </p>
            <Link to="/">
              <Button className="btn-gradient">Get started</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((b) => (
              <li key={b.id} className="card-soft p-4 flex items-center justify-between gap-3">
                <Link to={`/brief/${b.id}`} className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.title || "Untitled brief"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleString()} · {b.brief.questions.length} questions
                  </p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(b.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
};

export default History;
