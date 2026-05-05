import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { extractTextFromFile } from "@/lib/fileParse";
import { toast } from "sonner";

interface Props {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  fileName: string;
  onFileNameChange: (n: string) => void;
  placeholder: string;
}

export const UploadCard = ({ label, description, value, onChange, fileName, onFileNameChange, placeholder }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.length < 20) throw new Error("Couldn't read enough text from this file.");
      onChange(text);
      onFileNameChange(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setParsing(false);
    }
  };

  const clear = () => {
    onChange("");
    onFileNameChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="card-soft p-5 flex flex-col">
      <div className="mb-3">
        <h3 className="font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <Tabs defaultValue="upload" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="upload">Upload file</TabsTrigger>
          <TabsTrigger value="paste">Paste text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="flex-1 mt-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              drag ? "border-primary bg-accent/30" : "border-border bg-secondary/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Reading file…</span>
              </div>
            ) : fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                <button onClick={clear} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-foreground font-medium">Drop a file or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, DOC, TXT</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose file
                </Button>
              </>
            )}
          </div>
          {value && fileName && (
            <p className="text-xs text-muted-foreground mt-2">
              {value.length.toLocaleString()} characters extracted
            </p>
          )}
        </TabsContent>

        <TabsContent value="paste" className="flex-1 mt-3">
          <Textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (e.target.value && !fileName) onFileNameChange("Pasted text");
              if (!e.target.value) onFileNameChange("");
            }}
            placeholder={placeholder}
            className="min-h-[180px] resize-none bg-secondary/40"
          />
          {value && (
            <p className="text-xs text-muted-foreground mt-2">{value.length.toLocaleString()} characters</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
