"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WebhookEndpoint } from "../types";

export function DeleteEndpointDialog({
  target,
  isDeleting,
  onClose,
  onConfirm,
}: {
  target: WebhookEndpoint | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Delete webhook endpoint?</DialogTitle>
          <DialogDescription>
            {target
              ? `"${target.name.trim() || "Untitled endpoint"}" and all captured events will be permanently removed.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
