"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { deleteProjectFlowAction, deleteProjectModuleAction } from "../actions";

interface DeleteMapItemDialogProps {
  kind: "module" | "flow";
  projectId: string;
  slug: string;
  name: string;
  redirectHref: string;
}

export function DeleteMapItemDialog({
  kind,
  projectId,
  slug,
  name,
  redirectHref,
}: DeleteMapItemDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function confirmDelete() {
    startDeleting(async () => {
      const action = kind === "module" ? deleteProjectModuleAction : deleteProjectFlowAction;
      const result = await action(projectId, slug);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(kind === "module" ? "Module deleted." : "Flow deleted.");
      setIsOpen(false);
      router.push(redirectHref);
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        Delete {kind}
      </Button>
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          className="max-w-md sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Delete {kind}?</DialogTitle>
            <DialogDescription>
              {kind === "module"
                ? `"${name}" and all its flows will be removed.`
                : `"${name}" will be removed.`}{" "}
              Agents can regenerate it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
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
    </>
  );
}
