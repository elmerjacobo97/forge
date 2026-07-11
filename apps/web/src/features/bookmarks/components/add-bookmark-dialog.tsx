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
import { useForm } from "@tanstack/react-form";
import { bookmarksSchema, BookmarksSchema } from "../schemas/bookmarks-schema";
import { useCreateBookmarkMutation } from "../hooks/mutations";

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBookmarkDialog({
  isOpen,
  onOpenChange,
}: AddBookmarkDialogProps) {
  const createMutation = useCreateBookmarkMutation();

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

            <form.Field
              name="description"
            >
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
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums text-xs">
                          {field.state.value.length}/200
                        </InputGroupText>
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
