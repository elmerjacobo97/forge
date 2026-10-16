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
import { deleteNoteAction } from "../actions";
import type { Note } from "../types";

interface DeleteNoteDialogProps {
  note: Note;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteNoteDialog({ note, isOpen, onOpenChange }: DeleteNoteDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteNoteAction(note.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Note deleted successfully!");
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
          <DialogTitle>Delete note?</DialogTitle>
          <DialogDescription>{`"${note.title}" will be permanently removed.`}</DialogDescription>
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
