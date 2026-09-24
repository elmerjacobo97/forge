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
import { tagsFromString } from "@/lib/tags";
import { createResourceAction } from "../actions";
import { resourcesSchema, ResourcesSchema } from "../schemas/resources-schema";

interface AddResourceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({ isOpen, onOpenChange }: AddResourceDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
      category: "docs" as "docs" | "git" | "tool" | "article" | "other",
      description: "",
      tagsString: "",
    },
    validators: {
      onSubmit: resourcesSchema,
    },
    onSubmit: async ({ value }) => {
      addResource(value as ResourcesSchema);
    },
  });

  function addResource(data: ResourcesSchema) {
    startSaving(async () => {
      const result = await createResourceAction({
        title: data.title,
        url: data.url,
        category: data.category,
        description: data.description,
        tags: tagsFromString(data.tagsString),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Resource added successfully!");
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
        onInteractOutside={(event) => event.preventDefault()}
        className="max-h-[90vh] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Save a reference to documentation, repositories, or articles.
          </DialogDescription>
        </DialogHeader>

        <form
          className="-m-1 min-h-0 overflow-y-auto p-1"
          id="form-add-resource"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
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
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="url">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
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
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="category">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) =>
                          field.handleChange(val as ResourcesSchema["category"])
                        }
                      >
                        <SelectTrigger
                          id={field.name}
                          aria-invalid={isInvalid}
                        >
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
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="tagsString">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="css, react, web"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
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
                        className="max-h-48 resize-y overflow-y-auto"
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
          <Button
            type="submit"
            form="form-add-resource"
            disabled={isSaving}
          >
            Save Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
