import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm, useStore } from "@tanstack/react-form";
import { aiGenerationService } from "@/features/ai-generation/services/ai-generation-service";
import { bookmarksSchema, BookmarksSchema } from "../schemas/bookmarks-schema";
import { useCreateBookmarkMutation } from "../hooks/mutations";

function canGenerateBookmark(title: string, url: string) {
  if (title.trim().length < 2) return false;

  try {
    const parsedUrl = new URL(url);
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      !!parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBookmarkDialog({
  isOpen,
  onOpenChange,
}: AddBookmarkDialogProps) {
  const createMutation = useCreateBookmarkMutation();
  const [isGenerating, startGenerating] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
      category: "docs" as "docs" | "git" | "tool" | "article" | "other",
      description: "",
      tagsString: "",
    },
    validators: {
      onSubmit: bookmarksSchema,
    },
    onSubmit: async ({ value }) => {
      addBookmark(value as BookmarksSchema);
    },
  });
  const generationTitle = useStore(form.store, (state) => state.values.title);
  const generationUrl = useStore(form.store, (state) => state.values.url);

  function addBookmark(data: BookmarksSchema) {
    const tags = data.tagsString
      ? data.tagsString.split(",").flatMap((t: string) => {
          const trimmed = t.trim().toLowerCase();
          return trimmed ? [trimmed] : [];
        })
      : [];

    createMutation.mutate(
      {
        title: data.title,
        url: data.url,
        category: data.category,
        description: data.description,
        tags,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  }

  function generateBookmark(title: string, url: string) {
    if (!canGenerateBookmark(title, url)) return;

    startGenerating(async () => {
      try {
        const response = await aiGenerationService.generate({
          type: "bookmark",
          title: title.trim(),
          url,
        });
        if (response.type !== "bookmark") return;

        form.setFieldValue("category", response.data.category);
        form.setFieldValue("description", response.data.description);
        form.setFieldValue("tagsString", response.data.tags.join(", "));
      } catch {
        return;
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bookmark</DialogTitle>
          <DialogDescription>
            Save a reference to documentation, repositories, or articles.
          </DialogDescription>
        </DialogHeader>

        <form
          id="form-add-bookmark"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="title"
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Tailwind v4 Release Notes"
                      autoComplete="off"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field
              name="url"
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://…"
                      type="url"
                      autoComplete="off"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="category"
              >
                {(field) => (
                  <Field>
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      onValueChange={(val) =>
                        field.handleChange(val as BookmarksSchema["category"])
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docs">Docs</SelectItem>
                        <SelectItem value="git">Git Repo</SelectItem>
                        <SelectItem value="tool">Tool</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="tagsString"
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="css, react, web"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="What is this link about?"
                        rows={2}
                        className="resize-none"
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="block-end" className="justify-between">
                        <InputGroupText className="tabular-nums text-xs">
                          {field.state.value.length}/200
                        </InputGroupText>
                        <InputGroupButton
                          size="icon-xs"
                          disabled={
                            isGenerating ||
                            !canGenerateBookmark(generationTitle, generationUrl)
                          }
                          onClick={() => generateBookmark(generationTitle, generationUrl)}
                          aria-label="Generate bookmark details with AI"
                        >
                          {isGenerating ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Sparkles />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="form-add-bookmark">
            Save Bookmark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
