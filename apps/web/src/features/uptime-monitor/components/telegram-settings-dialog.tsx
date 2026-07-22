"use client";

import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useSaveNotificationSettingsMutation,
  useSendTestTelegramMessageMutation,
} from "../hooks/mutations";
import { useNotificationSettingsQuery } from "../hooks/queries";

type TelegramSettingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TelegramSettingsDialog({ isOpen, onOpenChange }: TelegramSettingsDialogProps) {
  const { data: settings, isLoading } = useNotificationSettingsQuery();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Telegram notifications</DialogTitle>
          <DialogDescription>
            Create a bot with{" "}
            <a
              href="https://core.telegram.org/bots#botfather"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              @BotFather
            </a>{" "}
            and paste its token and your chat ID to receive down/recovery alerts.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? null : (
          <TelegramSettingsForm
            key={settings?.updatedAt ?? "new"}
            telegramBotToken={settings?.telegramBotToken ?? ""}
            telegramChatId={settings?.telegramChatId ?? ""}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type TelegramSettingsFormProps = {
  telegramBotToken: string;
  telegramChatId: string;
  onSaved: () => void;
};

function TelegramSettingsForm({
  telegramBotToken,
  telegramChatId,
  onSaved,
}: TelegramSettingsFormProps) {
  const saveMutation = useSaveNotificationSettingsMutation();
  const testMutation = useSendTestTelegramMessageMutation();

  const form = useForm({
    defaultValues: { telegramBotToken, telegramChatId },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value, { onSuccess: onSaved });
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="telegramBotToken">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Bot token</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="123456:ABC-DEF..."
                autoComplete="off"
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="telegramChatId">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Chat ID</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="123456789"
                autoComplete="off"
              />
            </Field>
          )}
        </form.Field>
      </FieldGroup>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
        >
          {testMutation.isPending ? "Sending…" : "Send test message"}
        </Button>
        <Button
          type="submit"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
