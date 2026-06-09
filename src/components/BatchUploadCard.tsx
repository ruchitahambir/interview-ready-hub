import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractTextFromFile } from "@/lib/fileParse";
import { toast } from "sonner";

export interface CandidateFile {
  name: string;
  text: string;
}

interface Props {
  candidates: CandidateFile[];
  onChange: (c: CandidateFile[]) => void;
}

export const BatchUploadCard = ({ candidates, onChange }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setParsing(true);
    const added: CandidateFile[] = [];
    for (const f of list) {
      try {
        const text = await extractTextFromFile(f);
        if (!text || text.length < 20) {
          toast.error(`Skipped ${f.name}: not enough text`);
          continue;
        }
        added.push({ name: f.name, text });
      } catch (e) {
        toast.error(`Failed: ${f.name}`);
      }
    }
    if (added.length) {
      onChange([...candidates, ...added]);
      toast.success(`Added ${added.length} resume${added.length > 1 ? "s" : ""}`);
    }
    setParsing(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => onChange(candidates.filter((_, idx) => idx !== i));
  const clearAll = () => onChange([]);

  return (
    <div className="card-soft p-5 flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Candidate Resumes
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload one or many. PDF, DOCX, DOC, TXT.
          </p>
        </div>
        {candidates.length > 0 && (
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive">
            Clear all
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          drag ? "border-primary bg-accent/30" : "border-border bg-secondary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Reading files…</span>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-foreground font-medium">Drop files or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Batch upload supported</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
            >
              Choose files
            </Button>
          </>
        )}
      </div>

      {candidates.length > 0 && (
        <ul className="mt-4 space-y-1.5 max-h-64 overflow-y-auto">
          {candidates.map((c, i) => (
            <li key={i} className="flex items-center gap-2 bg-secondary/40 rounded-md px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {c.text.length.toLocaleString()} chars
              </span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
