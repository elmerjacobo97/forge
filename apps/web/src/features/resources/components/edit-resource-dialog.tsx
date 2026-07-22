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
import { FORMATS } from "../constants";
import { editResourceSchema, resourceSchema, ResourceSchema } from "../schemas/resource-schema";
import { useUpdateResourceMutation } from "../hooks/mutations";
import type { Resource } from "../types";
import { isSelectContentTarget, toFormatValue } from "../utils/resource-form";
import { ResourceFormFields, type ResourceFormApi } from "./resource-form-fields";

interface EditResourceDialogProps {
  resource: Resource;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditResourceDialog({ resource, isOpen, onOpenChange }: EditResourceDialogProps) {
  const updateMutation = useUpdateResourceMutation();
  const [isGenerating, startGenerating] = useTransition();
  const originalLanguage = resource.language;
  const legacyFormat =
    originalLanguage && !FORMATS.some((format) => format.value === originalLanguage.toLowerCase())
      ? originalLanguage
      : null;
  const allowsLegacyMissingTool = resource.kind === "config" && resource.tool === null;

  const form = useForm({
    defaultValues: {
      title: resource.title,
      kind: resource.kind,
      content: resource.content,
      language: toFormatValue(resource.language),
      tagsString: resource.tags.join(", "),
      tool: resource.tool ?? "",
      customTool: resource.customTool ?? "",
      version: resource.version ?? "",
      context: resource.context ?? "",
    },
    validators: {
      onSubmit: allowsLegacyMissingTool ? editResourceSchema : resourceSchema,
    },
    onSubmit: async ({ value }) => {
      saveResource(value as ResourceSchema);
    },
  });
  const generationTitle = useSelector(form.store, (state) => state.values.title);
  const selectedKind = useSelector(form.store, (state) => state.values.kind);
  const selectedTool = useSelector(form.store, (state) => state.values.tool);
  const isConfig = selectedKind === "config";

  function saveResource(data: ResourceSchema) {
    const tags = data.tagsString
      ? data.tagsString.split(",").flatMap((tag: string) => {
          const trimmed = tag.trim().toLowerCase();
          return trimmed ? [trimmed] : [];
        })
      : [];
    const language =
      legacyFormat && data.language === "other" ? legacyFormat : data.language.trim() || null;
    const tool = isConfig ? data.tool || null : null;
    const customTool = tool === "other" ? data.customTool.trim() || null : null;
    const version = isConfig ? data.version.trim() || null : null;
    const context = isConfig ? data.context.trim() || null : null;

    updateMutation.mutate(
      {
        id: resource.id,
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
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update this resource. Changes save to your library.</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <form
            id="form-edit-resource"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="form-edit-resource"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
