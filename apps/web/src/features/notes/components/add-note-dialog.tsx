import { useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { tagsFromString } from "@/lib/tags";
import { createNoteAction } from "../actions";
import { NO_PROJECT, noteSchema, type NoteSchema } from "../schemas/note-schema";
import type { NoteProject } from "../types";
import { projectIdFromValue } from "../utils/note-form";
import { NoteFormFields, type NoteFormApi } from "./note-form-fields";

interface AddNoteDialogProps {
  projects: NoteProject[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({ projects, isOpen, onOpenChange }: AddNoteDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: { title: "", content: "", tagsString: "", projectId: NO_PROJECT },
    validators: { onSubmit: noteSchema },
    onSubmit: async ({ value }) => {
      addNote(value as NoteSchema);
    },
  });

  function addNote(data: NoteSchema) {
    startSaving(async () => {
      const result = await createNoteAction({
        title: data.title,
        content: data.content,
        tags: tagsFromString(data.tagsString),
        projectId: projectIdFromValue(data.projectId),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Note added successfully!");
      onOpenChange(false);
      form.reset();
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[90vh] max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        style={{ pointerEvents: "auto" }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Save knowledge worth keeping: fixes, configs, and decisions.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 max-h-[55vh] overflow-y-auto px-4 py-1">
          <form
            id="form-add-note"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <NoteFormFields
              form={form as unknown as NoteFormApi}
              projects={projects}
            />
          </form>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="form-add-note"
            disabled={isSaving}
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
