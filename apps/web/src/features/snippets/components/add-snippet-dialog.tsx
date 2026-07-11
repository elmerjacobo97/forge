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
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { snippetSchema, SnippetSchema } from "../schemas/snippet-schema";
import { useCreateSnippetMutation } from "../hooks/mutations";

interface AddSnippetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSnippetDialog({
  isOpen,
  onOpenChange,
}: AddSnippetDialogProps) {
  const createMutation = useCreateSnippetMutation();

  const form = useForm({
    defaultValues: {
      title: "",
      kind: "note" as "note" | "prompt" | "config" | "snippet",
      content: "",
      language: "",
      tagsString: "",
    },
    validators: {
      onSubmit: snippetSchema,
    },
    onSubmit: async ({ value }) => {
      addSnippet(value as SnippetSchema);
    },
  });

  function addSnippet(data: SnippetSchema) {
    const tags = data.tagsString
      ? data.tagsString.split(",").flatMap((t: string) => {
          const trimmed = t.trim().toLowerCase();
          return trimmed ? [trimmed] : [];
        })
      : [];

    const language = data.language.trim() || null;

    createMutation.mutate(
      {
        title: data.title,
        kind: data.kind,
        content: data.content,
        language,
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
          <DialogTitle>Add Snippet</DialogTitle>
          <DialogDescription>
            Save a note, prompt, config, or code snippet for quick reuse.
          </DialogDescription>
        </DialogHeader>

        <form
          id="form-add-snippet"
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
                      placeholder="e.g. System prompt for code review"
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
                name="kind"
              >
                {(field) => (
                  <Field>
                    <FieldLabel>Kind</FieldLabel>
                    <Select
                      onValueChange={(val) =>
                        field.handleChange(val as SnippetSchema["kind"])
                      }
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

              <form.Field
                name="language"
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Language</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="json, bash, yaml… (optional)"
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            <form.Field
              name="content"
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Content</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Paste or type your content here…"
                        rows={8}
                        className="font-mono resize-none"
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
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
                    placeholder="prompt, review, yaml"
                  />
                </Field>
              )}
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
          <Button type="submit" form="form-add-snippet">
            Save Snippet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
