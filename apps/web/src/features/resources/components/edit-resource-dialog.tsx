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
import { updateResourceAction } from "../actions";
import { resourcesSchema, ResourcesSchema } from "../schemas/resources-schema";
import type { Resource } from "../types";

interface EditResourceDialogProps {
  resource: Resource;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditResourceDialog({ resource, isOpen, onOpenChange }: EditResourceDialogProps) {
  const [isSaving, startSaving] = useTransition();

  const form = useForm({
    defaultValues: {
      title: resource.title,
      url: resource.url,
      category: resource.category,
      description: resource.description,
      tagsString: resource.tags.join(", "),
    },
    validators: {
      onSubmit: resourcesSchema,
    },
    onSubmit: async ({ value }) => {
      saveResource(value as ResourcesSchema);
    },
  });

  function saveResource(data: ResourcesSchema) {
    startSaving(async () => {
      const result = await updateResourceAction(resource.id, {
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

      toast.success("Resource updated successfully!");
      onOpenChange(false);
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
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update this resource. Changes save to your library.</DialogDescription>
        </DialogHeader>

        <form
          className="-m-1 min-h-0 overflow-y-auto p-1"
          id="form-edit-resource"
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
            form="form-edit-resource"
            disabled={isSaving}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
