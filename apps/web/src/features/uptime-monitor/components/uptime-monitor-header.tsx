"use client";

import { useState } from "react";
import { Bell, Hash, Plus, Send } from "lucide-react";

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
        <h2 className="text-sm font-medium">Uptime monitors</h2>
        <p className="text-xs text-muted-foreground">
          {monitorCount}/{UPTIME_MAX_MONITORS_PER_USER} monitors
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
              <Bell />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsTelegramSettingsOpen(true)}>
              <Send />
              Telegram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSlackSettingsOpen(true)}>
              <Hash />
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
          <Plus data-icon="inline-start" />
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
