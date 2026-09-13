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
import { updateIdeaAction } from "../actions";
import { ideaSchema, type IdeaSchema } from "../schemas/idea-schema";
import type { Idea } from "../types";
import { linksFromString } from "../utils/idea-form";
import { IdeaFormFields, type IdeaFormApi } from "./idea-form-fields";

interface EditIdeaDialogProps {
  idea: Idea;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIdeaDialog({ idea, isOpen, onOpenChange }: EditIdeaDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: {
      title: idea.title,
      content: idea.content,
      status: idea.status,
      category: idea.category,
      tagsString: idea.tags.join(", "),
      linksString: idea.links.join("\n"),
    },
    validators: {
      onSubmit: ideaSchema,
    },
    onSubmit: async ({ value }) => {
      saveIdea(value as IdeaSchema);
    },
  });

  function saveIdea(data: IdeaSchema) {
    startSaving(async () => {
      const result = await updateIdeaAction(idea.id, {
        title: data.title,
        content: data.content,
        status: data.status,
        category: data.category,
        tags: tagsFromString(data.tagsString),
        links: linksFromString(data.linksString),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Idea updated successfully!");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[90vh] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        style={{ pointerEvents: "auto" }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Idea</DialogTitle>
          <DialogDescription>Update this idea. Changes save immediately.</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 max-h-[50vh] overflow-y-auto px-4 py-1">
          <form
            id="form-edit-idea"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <IdeaFormFields form={form as unknown as IdeaFormApi} />
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
            form="form-edit-idea"
            disabled={isSaving}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
