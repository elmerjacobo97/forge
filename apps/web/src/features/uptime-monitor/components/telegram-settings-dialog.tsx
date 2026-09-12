"use client";

import { useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveNotificationSettingsAction, sendTestTelegramMessageAction } from "../actions";
import type { UptimeNotificationSettings } from "../types";

type TelegramSettingsDialogProps = {
  settings: UptimeNotificationSettings | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TelegramSettingsDialog({
  settings,
  isOpen,
  onOpenChange,
}: TelegramSettingsDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-w-md"
      >
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

        <TelegramSettingsForm
          key={settings?.updatedAt ?? "new"}
          telegramBotToken={settings?.telegramBotToken ?? ""}
          telegramChatId={settings?.telegramChatId ?? ""}
          onSaved={() => onOpenChange(false)}
        />
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
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();

  const form = useForm({
    defaultValues: { telegramBotToken, telegramChatId },
    onSubmit: async ({ value }) => {
      startSaving(async () => {
        const result = await saveNotificationSettingsAction(value);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success("Telegram settings saved.");
        onSaved();
      });
    },
  });

  function sendTestMessage() {
    startTesting(async () => {
      const result = await sendTestTelegramMessageAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Test message sent.");
    });
  }

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
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Bot token</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="123456:ABC-DEF..."
                  autoComplete="off"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="telegramChatId">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Chat ID</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="123456789"
                  autoComplete="off"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={sendTestMessage}
          disabled={isTesting}
        >
          {isTesting ? "Sending…" : "Send test message"}
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
