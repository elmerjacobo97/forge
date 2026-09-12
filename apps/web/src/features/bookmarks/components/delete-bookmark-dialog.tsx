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
import { deleteBookmarkAction } from "../actions";
import type { Bookmark } from "../types";

interface DeleteBookmarkDialogProps {
  bookmark: Bookmark;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBookmarkDialog({
  bookmark,
  isOpen,
  onOpenChange,
}: DeleteBookmarkDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteBookmarkAction(bookmark.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Bookmark deleted successfully!");
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
          <DialogTitle>Delete bookmark?</DialogTitle>
          <DialogDescription>
            {`"${bookmark.title}" will be permanently removed.`}
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
