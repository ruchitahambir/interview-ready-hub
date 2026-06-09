import { useState } from "react";
import { Plus, X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SkillWeight } from "@/lib/types";

interface Props {
  value: SkillWeight[];
  onChange: (v: SkillWeight[]) => void;
}

export const SkillWeights = ({ value, onChange }: Props) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const s = draft.trim();
    if (!s) return;
    onChange([...value, { skill: s, weight: 3, mustHave: false }]);
    setDraft("");
  };

  const update = (i: number, patch: Partial<SkillWeight>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="card-soft p-5">
      <div className="mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Custom Skill Weights</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Add skills you care about. Set importance (1–5) or mark as a dealbreaker (must-have).
      </p>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder='e.g. "Must have OutSystems experience"'
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-10"
        />
        <Button type="button" onClick={add} variant="outline" size="sm" className="h-10">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No custom weights — using default scoring.</p>
      ) : (
        <ul className="space-y-3">
          {value.map((s, i) => (
            <li key={i} className="bg-secondary/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.skill}</p>
                </div>
                <button
                  onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.mustHave}
                    onCheckedChange={(v) => update(i, { mustHave: v })}
                    id={`must-${i}`}
                  />
                  <label htmlFor={`must-${i}`} className="text-xs font-medium cursor-pointer">
                    Dealbreaker
                  </label>
                  {s.mustHave && <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]" variant="outline">MUST-HAVE</Badge>}
                </div>
                {!s.mustHave && (
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <span className="text-xs text-muted-foreground">Weight</span>
                    <Slider
                      value={[s.weight]}
                      onValueChange={([v]) => update(i, { weight: v })}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-semibold w-4">{s.weight}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
