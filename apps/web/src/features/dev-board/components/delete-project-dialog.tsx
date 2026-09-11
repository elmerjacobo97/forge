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
import { deleteProjectAction } from "../actions";
import type { Project } from "../types/project";

interface DeleteProjectDialogProps {
  project: Project;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, isOpen, onOpenChange }: DeleteProjectDialogProps) {
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Project deleted.");
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
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>
            {`"${project.name}" will be removed. Projects with tickets cannot be deleted.`}
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
