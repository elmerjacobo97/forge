import { GeneralSettingsTab } from "./components/general-settings-tab";

export function Settings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">General Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage application preferences.
        </p>
      </div>

      <GeneralSettingsTab />
    </div>
  );
}
