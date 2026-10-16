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
import { updateNoteAction } from "../actions";
import { noteSchema, type NoteSchema } from "../schemas/note-schema";
import type { Note, NoteProject } from "../types";
import { projectIdFromValue, projectValueFromId } from "../utils/note-form";
import { NoteFormFields, type NoteFormApi } from "./note-form-fields";

interface EditNoteDialogProps {
  note: Note;
  projects: NoteProject[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNoteDialog({ note, projects, isOpen, onOpenChange }: EditNoteDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: {
      title: note.title,
      content: note.content,
      tagsString: note.tags.join(", "),
      projectId: projectValueFromId(note.projectId),
    },
    validators: { onSubmit: noteSchema },
    onSubmit: async ({ value }) => {
      saveNote(value as NoteSchema);
    },
  });

  function saveNote(data: NoteSchema) {
    startSaving(async () => {
      const result = await updateNoteAction(note.id, {
        title: data.title,
        content: data.content,
        tags: tagsFromString(data.tagsString),
        projectId: projectIdFromValue(data.projectId),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Note updated successfully!");
      onOpenChange(false);
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
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>Update this note. Changes save immediately.</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 max-h-[55vh] overflow-y-auto px-4 py-1">
          <form
            id="form-edit-note"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
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
            form="form-edit-note"
            disabled={isSaving}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
