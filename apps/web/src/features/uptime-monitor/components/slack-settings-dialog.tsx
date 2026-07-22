"use client";

import { useForm } from "@tanstack/react-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  useClearSlackWebhookMutation,
  useSaveSlackNotificationSettingsMutation,
  useSendTestSlackMessageMutation,
} from "../hooks/mutations";
import { useSlackNotificationSettingsQuery } from "../hooks/queries";

type SlackSettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SlackSettingsDialog({ isOpen, onOpenChange }: SlackSettingsDialogProps) {
  const { data: settings, isLoading } = useSlackNotificationSettingsQuery();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Slack notifications</DialogTitle>
          <DialogDescription>
            Create an{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Incoming Webhook
            </a>{" "}
            in Slack and paste the URL to receive down/recovery alerts. The saved webhook is never
            shown again.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? null : (
          <SlackSettingsForm
            key={settings?.updatedAt ?? "new"}
            slackConfigured={settings?.slackConfigured ?? false}
            slackEnabled={settings?.slackEnabled ?? false}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type SlackSettingsFormProps = {
  slackConfigured: boolean;
  slackEnabled: boolean;
  onSaved: () => void;
};

function SlackSettingsForm({
  slackConfigured,
  slackEnabled,
  onSaved,
}: SlackSettingsFormProps) {
  const saveMutation = useSaveSlackNotificationSettingsMutation();
  const clearMutation = useClearSlackWebhookMutation();
  const testMutation = useSendTestSlackMessageMutation();

  const form = useForm({
    defaultValues: {
      slackWebhookUrl: "",
      slackEnabled,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(
        {
          slackWebhookUrl: value.slackWebhookUrl.trim() || undefined,
          slackEnabled: value.slackEnabled,
          clearSlackWebhook: false,
        },
        { onSuccess: onSaved },
      );
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Webhook status</p>
        <Badge variant={slackConfigured ? "secondary" : "outline"}>
          {slackConfigured ? "Configured" : "Not configured"}
        </Badge>
      </div>

      <FieldGroup>
        <form.Field name="slackWebhookUrl">
          {(webhookField) => (
            <>
              <form.Field name="slackEnabled">
                {(field) => {
                  const canEnable =
                    slackConfigured || Boolean(webhookField.state.value.trim());
                  return (
                    <Field orientation="horizontal">
                      <div className="flex flex-1 flex-col gap-1">
                        <FieldLabel htmlFor={field.name}>Enable Slack alerts</FieldLabel>
                        <FieldDescription>
                          Requires a saved webhook or a new HTTPS hooks.slack.com URL in this
                          form.
                        </FieldDescription>
                      </div>
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        disabled={!canEnable && !field.state.value}
                        onCheckedChange={(enabled) => {
                          if (enabled && !canEnable) return;
                          field.handleChange(enabled);
                        }}
                        aria-label="Enable Slack alerts"
                      />
                    </Field>
                  );
                }}
              </form.Field>

              <Field>
                <FieldLabel htmlFor={webhookField.name}>
                  {slackConfigured ? "Replace webhook URL" : "Webhook URL"}
                </FieldLabel>
                <Input
                  id={webhookField.name}
                  name={webhookField.name}
                  type="url"
                  value={webhookField.state.value}
                  onBlur={webhookField.handleBlur}
                  onChange={(event) => webhookField.handleChange(event.target.value)}
                  placeholder={
                    slackConfigured
                      ? "Leave blank to keep the current webhook"
                      : "https://hooks.slack.com/services/..."
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
                <FieldDescription>
                  Only HTTPS URLs on hooks.slack.com are accepted. The previous value is never
                  displayed.
                </FieldDescription>
              </Field>
            </>
          )}
        </form.Field>
      </FieldGroup>

      <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? "Sending…" : "Send test message"}
          </Button>
          {slackConfigured ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || saveMutation.isPending}
            >
              {clearMutation.isPending ? "Removing…" : "Remove webhook"}
            </Button>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={saveMutation.isPending || clearMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
