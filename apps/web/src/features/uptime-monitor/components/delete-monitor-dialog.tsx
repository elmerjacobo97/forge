"use client";

import { useTransition } from "react";
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
import { deleteUptimeMonitorAction } from "../actions";
import type { UptimeMonitor } from "../types";

interface DeleteMonitorDialogProps {
  monitor: UptimeMonitor;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMonitorDialog({ monitor, isOpen, onOpenChange }: DeleteMonitorDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteUptimeMonitorAction(monitor.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Monitor deleted.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete monitor?</DialogTitle>
          <DialogDescription>
            {`"${monitor.name}" and all its checks and incidents will be permanently removed.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
