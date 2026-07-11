import { useState } from "react";
import { Eye, EyeOff, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "../hooks/use-settings";

const MODELS = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B (OpenAI)",
    description: "120B parameter MoE model. Excellent quality but strict TPM limits on free tier.",
  },
  {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B (Alibaba)",
    description: "High-quality 27B model. Good balance of performance and rate limits.",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant (Meta)",
    description: "Insanely fast 8B model. Generous rate limits, perfect for quick commits.",
  },
];

export function AiSettingsTab() {
  const { groqApiKey, groqModel, saveGroqApiKey, saveGroqModel, loading } = useSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = draft ?? groqApiKey;
  const isDirty = draft !== null && draft !== groqApiKey;

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    try {
      await saveGroqApiKey(draft!);
      setDraft(null);
      setSaved(true);
      toast.success("API key saved successfully.");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Failed to save API key.");
    } finally {
      setSaving(false);
    }
  }

  const selectedModelInfo = MODELS.find((m) => m.id === groqModel) || MODELS[0];

  return (
    <div className="space-y-8">
      {/* Groq API Key */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Groq API Key</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used by the Git Commits tool to generate AI-powered commit messages.{" "}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
                  openUrl("https://console.groq.com/keys"),
                );
              }}
            >
              Get a free key
              <ExternalLink className="size-3" />
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="groq-api-key">API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="groq-api-key"
                type={visible ? "text" : "password"}
                placeholder={loading ? "Loading…" : "gsk_••••••••••••••••••••••"}
                value={loading ? "" : current}
                disabled={loading}
                onChange={(e) => setDraft(e.target.value)}
                className="pr-9 font-mono text-xs"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={visible ? "Hide key" : "Show key"}
              >
                {visible ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>

            <Button
              onClick={handleSave}
              disabled={!isDirty || saving}
              size="sm"
              className="shrink-0"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="size-3.5 text-green-500" />
              ) : (
                "Save"
              )}
            </Button>
          </div>

          {current && !isDirty && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              Key configured
            </p>
          )}
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="groq-model">LLM Model</Label>
        <Select
          value={groqModel}
          onValueChange={(val) => {
            saveGroqModel(val);
            toast.success(`Model updated to ${val}`);
          }}
          disabled={loading}
        >
          <SelectTrigger id="groq-model" className="w-full text-xs">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-xs">
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model info */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
        <p className="text-xs font-medium text-foreground">Model details</p>
        <p className="text-xs text-muted-foreground font-mono">
          {selectedModelInfo.id}
        </p>
        <p className="text-xs text-muted-foreground">
          {selectedModelInfo.description}
        </p>
      </div>
    </div>
  );
}
