"use client";

import { useState } from "react";
import { Activity, Plus, Send } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UPTIME_MAX_MONITORS_PER_USER } from "./constants";
import { MonitorFormDialog } from "./components/monitor-form-dialog";
import { MonitorTableRow } from "./components/monitor-table-row";
import { TelegramSettingsDialog } from "./components/telegram-settings-dialog";
import { useDeleteUptimeMonitorMutation } from "./hooks/mutations";
import { useUptimeMonitorsQuery } from "./hooks/queries";
import type { UptimeMonitor } from "./types";

export function UptimeMonitor() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<UptimeMonitor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UptimeMonitor | null>(null);

  const { data: monitors = [], isLoading, isError, error } = useUptimeMonitorsQuery();
  const deleteMutation = useDeleteUptimeMonitorMutation();

  const atLimit = monitors.length >= UPTIME_MAX_MONITORS_PER_USER;

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Uptime monitors</h2>
          <p className="text-xs text-muted-foreground">
            {monitors.length}/{UPTIME_MAX_MONITORS_PER_USER} monitors
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Send data-icon="inline-start" />
            Telegram settings
          </Button>
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
      </div>

      {atLimit ? (
        <Alert>
          <AlertTitle>Monitor limit reached</AlertTitle>
          <AlertDescription>
            Delete a monitor before creating another (max {UPTIME_MAX_MONITORS_PER_USER}).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-input/60">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-muted/40"
              />
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <Activity className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No monitors yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create a monitor to check one of your URLs on a schedule and get alerted on Telegram
              when it goes down.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus data-icon="inline-start" />
              Create monitor
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monitor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last latency</TableHead>
                <TableHead>Uptime (24h)</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor) => (
                <MonitorTableRow
                  key={monitor.id}
                  monitor={monitor}
                  onEdit={setEditingMonitor}
                  onDelete={setDeleteTarget}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <MonitorFormDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        disabled={atLimit}
      />

      {editingMonitor ? (
        <MonitorFormDialog
          key={editingMonitor.id}
          monitor={editingMonitor}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditingMonitor(null);
          }}
        />
      ) : null}

      <TelegramSettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete monitor?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" and all its checks and incidents will be permanently removed.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
