import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings2 } from "lucide-react";
import { AiSettingsTab } from "./components/ai-settings-tab";
import { GeneralSettingsTab } from "./components/general-settings-tab";

export function Settings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your API keys and application preferences.
        </p>
      </div>

      <Tabs defaultValue="ai">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ai" className="gap-1.5">
            <Sparkles className="size-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5">
            <Settings2 className="size-3.5" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-6">
          <AiSettingsTab />
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
