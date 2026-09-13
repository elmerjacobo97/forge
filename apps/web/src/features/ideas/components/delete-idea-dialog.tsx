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
import { deleteIdeaAction } from "../actions";
import type { Idea } from "../types";

interface DeleteIdeaDialogProps {
  idea: Idea;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteIdeaDialog({ idea, isOpen, onOpenChange }: DeleteIdeaDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteIdeaAction(idea.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Idea deleted successfully!");
      onOpenChange(false);
    });
  }

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
          <DialogTitle>Delete idea?</DialogTitle>
          <DialogDescription>{`"${idea.title}" will be permanently removed.`}</DialogDescription>
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
