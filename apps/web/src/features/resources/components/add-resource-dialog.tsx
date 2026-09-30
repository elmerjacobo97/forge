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
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { tagsFromString } from "@/lib/tags";
import { createResourceAction } from "../actions";
import { resourcesSchema, ResourcesSchema } from "../schemas/resources-schema";

interface AddResourceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TextFieldRowProps {
  field: AnyFieldApi;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}

function TextFieldRow({ field, label, placeholder, type, autoComplete }: TextFieldRowProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

const CATEGORY_OPTIONS: { value: ResourcesSchema["category"]; label: string }[] = [
  { value: "docs", label: "Docs" },
  { value: "git", label: "Git Repo" },
  { value: "tool", label: "Tool" },
  { value: "article", label: "Article" },
  { value: "other", label: "Other" },
];

function CategoryField({ field }: { field: AnyFieldApi }) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
      <Select
        value={field.state.value}
        onValueChange={(val) => field.handleChange(val as ResourcesSchema["category"])}
      >
        <SelectTrigger
          id={field.name}
          aria-invalid={isInvalid}
        >
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

function DescriptionField({ field }: { field: AnyFieldApi }) {
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
              {(field) => (
                <TextFieldRow
                  field={field}
                  label="Title"
                  placeholder="e.g. Tailwind v4 Release Notes"
                  autoComplete="off"
                />
              )}
            </form.Field>

            <form.Field name="url">
              {(field) => (
                <TextFieldRow
                  field={field}
                  label="URL"
                  placeholder="https://…"
                  autoComplete="off"
                  type="url"
                />
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="category">{(field) => <CategoryField field={field} />}</form.Field>

              <form.Field name="tagsString">
                {(field) => (
                  <TextFieldRow
                    field={field}
                    label="Tags"
                    placeholder="css, react, web"
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => <DescriptionField field={field} />}
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
