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
import { useSelector } from "@tanstack/react-store";
import { aiGenerationService } from "@/features/ai-generation/services/ai-generation-service";
import { resourceSchema, ResourceSchema } from "../schemas/resource-schema";
import { useCreateResourceMutation } from "../hooks/mutations";
import { isSelectContentTarget, toFormatValue } from "../utils/resource-form";
import { ResourceFormFields, type ResourceFormApi } from "./resource-form-fields";

interface AddResourceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ isOpen, onOpenChange }: AddResourceDialogProps) {
  const createMutation = useCreateResourceMutation();
  const [isGenerating, startGenerating] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      kind: "note" as "note" | "prompt" | "config" | "code",
      content: "",
      language: "",
      tagsString: "",
      tool: "",
      customTool: "",
      version: "",
      context: "",
    },
    validators: {
      onSubmit: resourceSchema,
    },
    onSubmit: async ({ value }) => {
      addResource(value as ResourceSchema);
    },
  });
  const generationTitle = useSelector(form.store, (state) => state.values.title);
  const selectedKind = useSelector(form.store, (state) => state.values.kind);
  const selectedTool = useSelector(form.store, (state) => state.values.tool);
  const isConfig = selectedKind === "config";

  function addResource(data: ResourceSchema) {
    const tags = data.tagsString
      ? data.tagsString.split(",").flatMap((t: string) => {
          const trimmed = t.trim().toLowerCase();
          return trimmed ? [trimmed] : [];
        })
      : [];

    const language = data.language.trim() || null;
    const tool = data.tool || null;
    const customTool = tool === "other" ? data.customTool.trim() || null : null;
    const version = data.version.trim() || null;
    const context = data.context.trim() || null;

    createMutation.mutate(
      {
        title: data.title,
        kind: data.kind,
        content: data.content,
        language,
        tags,
        tool,
        customTool,
        version,
        context,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  }

  function generateResource(title: string) {
    if (title.trim().length < 2) return;

    startGenerating(async () => {
      try {
        const response = await aiGenerationService.generate({
          type: "resource",
          title: title.trim(),
        });
        if (response.type !== "resource") return;

        form.setFieldValue("kind", response.data.kind);
        form.setFieldValue("content", response.data.content);
        form.setFieldValue("language", toFormatValue(response.data.language));
        form.setFieldValue("tagsString", response.data.tags.join(", "));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to generate resource details.",
        );
      }
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-w-md"
        style={{ pointerEvents: "auto" }}
        onPointerDownOutside={(event) => {
          if (isSelectContentTarget(event.target)) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSelectContentTarget(event.target)) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Save a note, prompt, code sample, or reusable configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <form
            id="form-add-resource"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <ResourceFormFields
              form={form as unknown as ResourceFormApi}
              isConfig={isConfig}
              selectedTool={selectedTool}
              generationTitle={generationTitle}
              isGenerating={isGenerating}
              onGenerate={generateResource}
            />
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
            form="form-add-resource"
          >
            Save Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
