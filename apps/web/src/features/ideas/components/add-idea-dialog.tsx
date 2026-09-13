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
import { createIdeaAction } from "../actions";
import { ideaSchema, type IdeaSchema } from "../schemas/idea-schema";
import { linksFromString } from "../utils/idea-form";
import { IdeaFormFields, type IdeaFormApi } from "./idea-form-fields";

interface AddIdeaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddIdeaDialog({ isOpen, onOpenChange }: AddIdeaDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      status: "seed" as "seed" | "exploring" | "building" | "parked" | "shipped",
      category: "other" as "app" | "web" | "mobile" | "business" | "other",
      tagsString: "",
      linksString: "",
    },
    validators: {
      onSubmit: ideaSchema,
    },
    onSubmit: async ({ value }) => {
      addIdea(value as IdeaSchema);
    },
  });

  function addIdea(data: IdeaSchema) {
    startSaving(async () => {
      const result = await createIdeaAction({
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

      toast.success("Idea added successfully!");
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
        className="max-h-[90vh] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
        style={{ pointerEvents: "auto" }}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Idea</DialogTitle>
          <DialogDescription>
            Capture an idea with a title, description, status, and references.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 max-h-[50vh] overflow-y-auto px-4 py-1">
          <form
            id="form-add-idea"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <IdeaFormFields form={form as unknown as IdeaFormApi} />
          </form>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="form-add-idea"
            disabled={isSaving}
          >
            Save Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
