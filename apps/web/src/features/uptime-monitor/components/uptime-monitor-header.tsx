"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HashtagIcon,
  Notification01Icon,
  PlusSignIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UPTIME_MAX_MONITORS_PER_USER } from "../constants";
import type { SlackNotificationSettings, UptimeNotificationSettings } from "../types";
import { MonitorFormDialog } from "./monitor-form-dialog";
import { SlackSettingsDialog } from "./slack-settings-dialog";
import { TelegramSettingsDialog } from "./telegram-settings-dialog";

interface UptimeMonitorHeaderProps {
  monitorCount: number;
  atLimit: boolean;
  telegramSettings: UptimeNotificationSettings | null;
  slackSettings: SlackNotificationSettings | null;
}

export function UptimeMonitorHeader({
  monitorCount,
  atLimit,
  telegramSettings,
  slackSettings,
}: UptimeMonitorHeaderProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTelegramSettingsOpen, setIsTelegramSettingsOpen] = useState(false);
  const [isSlackSettingsOpen, setIsSlackSettingsOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-lg font-medium tracking-tight">Uptime monitors</h1>
        <p className="text-xs text-muted-foreground">
          Monitor your URLs with scheduled HTTP checks and Telegram alerts. {monitorCount}/
          {UPTIME_MAX_MONITORS_PER_USER} monitors.
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Notification settings"
            >
              <HugeiconsIcon
                icon={Notification01Icon}
                strokeWidth={2}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsTelegramSettingsOpen(true)}>
              <HugeiconsIcon
                icon={SentIcon}
                strokeWidth={2}
              />
              Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSlackSettingsOpen(true)}>
              <HugeiconsIcon
                icon={HashtagIcon}
                strokeWidth={2}
              />
              Slack
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          disabled={atLimit}
          title={
            atLimit ? `You can have at most ${UPTIME_MAX_MONITORS_PER_USER} monitors.` : undefined
          }
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Create monitor
        </Button>
      </div>

      <MonitorFormDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        disabled={atLimit}
      />

      <TelegramSettingsDialog
        settings={telegramSettings}
        isOpen={isTelegramSettingsOpen}
        onOpenChange={setIsTelegramSettingsOpen}
      />

      <SlackSettingsDialog
        settings={slackSettings}
        isOpen={isSlackSettingsOpen}
        onOpenChange={setIsSlackSettingsOpen}
      />
    </div>
  );
}
