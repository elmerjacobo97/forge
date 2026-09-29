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
import { deleteMeetingAction } from "../actions";

export function DeleteMeetingDialog({
  meetingId,
  meetingTitle,
  isOpen,
  onOpenChange,
  onDeleted,
}: {
  meetingId: string;
  meetingTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteMeetingAction(meetingId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Meeting deleted. Linked tickets remain on Dev Board.");
      onOpenChange(false);
      onDeleted?.();
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-w-md sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Delete this meeting?</DialogTitle>
          <DialogDescription>
            {`"${meetingTitle}" and its notes will be removed. Dev Board tickets are not affected.`}
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
            {isDeleting ? "Deleting…" : "Delete meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
