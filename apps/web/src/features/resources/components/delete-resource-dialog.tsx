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
import { deleteResourceAction } from "../actions";
import type { Resource } from "../types";

interface DeleteResourceDialogProps {
  resource: Resource;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteResourceDialog({
  resource,
  isOpen,
  onOpenChange,
}: DeleteResourceDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteResourceAction(resource.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Resource deleted successfully!");
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
          <DialogTitle>Delete resource?</DialogTitle>
          <DialogDescription>
            {`"${resource.title}" will be permanently removed.`}
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
