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
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm, useStore } from "@tanstack/react-form";
import { AiGenerationButton } from "@/features/ai-generation/components/ai-generation-button";
import { aiGenerationService } from "@/features/ai-generation/services/ai-generation-service";
import { FORMATS, TOOLS } from "../constants";
import { snippetSchema, SnippetSchema } from "../schemas/snippet-schema";
import { useCreateSnippetMutation } from "../hooks/mutations";

interface AddSnippetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function isSelectContentTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-slot="select-content"]') !== null;
}

function toFormatValue(language: string | null): string {
  const value = language?.trim().toLowerCase() ?? "";
  return value && FORMATS.some((format) => format.value === value) ? value : value ? "other" : "";
}

export function AddSnippetDialog({ isOpen, onOpenChange }: AddSnippetDialogProps) {
  const createMutation = useCreateSnippetMutation();
  const [isGenerating, startGenerating] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      kind: "note" as "note" | "prompt" | "config" | "snippet",
      content: "",
      language: "",
      tagsString: "",
      tool: "",
      customTool: "",
      version: "",
      context: "",
    },
    validators: {
      onSubmit: snippetSchema,
    },
    onSubmit: async ({ value }) => {
      addSnippet(value as SnippetSchema);
    },
  });
  const generationTitle = useStore(form.store, (state) => state.values.title);
  const selectedKind = useStore(form.store, (state) => state.values.kind);
  const selectedTool = useStore(form.store, (state) => state.values.tool);
  const isConfig = selectedKind === "config";

  function addSnippet(data: SnippetSchema) {
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

  function generateSnippet(title: string) {
    if (title.trim().length < 2) return;

    startGenerating(async () => {
      try {
        const response = await aiGenerationService.generate({
          type: "snippet",
          title: title.trim(),
        });
        if (response.type !== "snippet") return;

        form.setFieldValue("kind", response.data.kind);
        form.setFieldValue("content", response.data.content);
        form.setFieldValue("language", toFormatValue(response.data.language));
        form.setFieldValue("tagsString", response.data.tags.join(", "));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to generate snippet details.");
      }
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[calc(100vh-2rem)] max-w-md grid-rows-[auto_minmax(0,1fr)_auto]"
        onPointerDownOutside={(event) => {
          if (isSelectContentTarget(event.target)) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSelectContentTarget(event.target)) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Snippet</DialogTitle>
          <DialogDescription>
            Save a note, prompt, config, or code snippet for quick reuse.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 min-w-0 pr-3">
          <form
            id="form-add-snippet"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="title">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. System prompt for code review"
                        autoComplete="off"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="kind">
                  {(field) => (
                    <Field>
                      <FieldLabel>Kind</FieldLabel>
                      <Select
                        onValueChange={(val) => field.handleChange(val as SnippetSchema["kind"])}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="prompt">Prompt</SelectItem>
                          <SelectItem value="config">Config</SelectItem>
                          <SelectItem value="snippet">Snippet</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="language">
                  {(field) => (
                    <Field>
                      <FieldLabel>Format</FieldLabel>
                      <Select
                        onValueChange={(value) => field.handleChange(value)}
                        value={field.state.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMATS.map((format) => (
                            <SelectItem
                              key={format.value}
                              value={format.value}
                            >
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
              </div>

              {isConfig ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="tool">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched && !!field.state.meta.errors.length;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel>Tool</FieldLabel>
                            <Select
                              onValueChange={(value) =>
                                field.handleChange(value as SnippetSchema["tool"])
                              }
                              value={field.state.value || undefined}
                            >
                              <SelectTrigger aria-invalid={isInvalid}>
                                <SelectValue placeholder="Select tool" />
                              </SelectTrigger>
                              <SelectContent>
                                {TOOLS.map((tool) => (
                                  <SelectItem
                                    key={tool.value}
                                    value={tool.value}
                                  >
                                    {tool.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    <form.Field name="version">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Version</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. 0.75 (optional)"
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  {selectedTool === "other" ? (
                    <form.Field name="customTool">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched && !!field.state.meta.errors.length;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Custom tool name</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value ?? ""}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Zed"
                              aria-invalid={isInvalid}
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>
                  ) : null}

                  <form.Field name="context">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Context</FieldLabel>
                        <InputGroup>
                          <InputGroupTextarea
                            id={field.name}
                            name={field.name}
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="How or where this configuration is used (optional)"
                            rows={3}
                            className="min-h-20"
                          />
                        </InputGroup>
                      </Field>
                    )}
                  </form.Field>
                </>
              ) : null}

              <form.Field name="content">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Content</FieldLabel>
                      <InputGroup className="overflow-hidden">
                        <InputGroupTextarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Paste or type your content here…"
                          rows={8}
                          className="min-h-52 max-h-52 overflow-y-auto font-mono resize-none"
                          aria-invalid={isInvalid}
                        />
                        <InputGroupAddon
                          align="block-end"
                          className="justify-end"
                        >
                          <AiGenerationButton
                            label="Generate snippet details with AI"
                            disabled={generationTitle.trim().length < 2}
                            onClick={() => generateSnippet(generationTitle)}
                            isGenerating={isGenerating}
                          />
                        </InputGroupAddon>
                      </InputGroup>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="tagsString">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="prompt, review, yaml"
                    />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </form>
        </ScrollArea>

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
            form="form-add-snippet"
          >
            Save Snippet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
