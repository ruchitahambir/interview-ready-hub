import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getSettings, setSettings } from "@/lib/settings";
import { Key, Shield, Lock } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");

  useEffect(() => {
    const s = getSettings();
    setApiKey(s.apiKey);
    setProvider(s.provider);
  }, []);

  const save = () => {
    setSettings({ apiKey: apiKey.trim(), provider });
    toast.success("Settings saved");
  };

  return (
    <>
      <AppHeader />
      <main className="container max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your AI provider. Leave blank to use the built-in Universal Key.
        </p>

        <div className="card-soft p-6 space-y-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/40">
            <Shield className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-accent-foreground">
              <p className="font-medium">Universal Key (default)</p>
              <p className="text-accent-foreground/80">
                Out of the box, the app uses a built-in Lovable AI key — no setup needed.
                Optionally provide your own OpenAI or Anthropic key below.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Key className="w-4 h-4" /> Provider
            </Label>
            <RadioGroup value={provider} onValueChange={(v) => setProvider(v as "openai" | "anthropic")}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai" className="font-normal cursor-pointer">OpenAI</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="anthropic" id="anthropic" />
                <Label htmlFor="anthropic" className="font-normal cursor-pointer">Anthropic</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key" className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Your API key (optional)
            </Label>
            <Input
              id="key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Stored locally in your browser only. Sent only to power your AI requests.
            </p>
          </div>

          <Button onClick={save} className="btn-gradient w-full">Save settings</Button>
        </div>

        <div className="card-soft p-5 mt-6">
          <h3 className="font-semibold mb-1">Accounts (coming soon)</h3>
          <p className="text-sm text-muted-foreground">
            v1 doesn't require sign-in — your history is saved on this device.
            We'll add optional accounts to sync across devices in a future update.
          </p>
        </div>
      </main>
    </>
  );
};

export default Settings;
