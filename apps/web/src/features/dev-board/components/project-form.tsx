import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { type ProjectFormValues, projectSchema } from "../schemas/project";
import type { Project } from "../types/project";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProject: Project | null;
  onSubmit: (values: ProjectFormValues) => void;
}

const formatErrors = (errors: unknown[]) =>
  errors.map((error) => {
    if (typeof error === "string") return { message: error };
    if (error && typeof error === "object" && "message" in error) {
      return { message: String(error.message) };
    }
    return { message: error?.toString() || "Invalid value" };
  });

export function ProjectForm({
  open,
  onOpenChange,
  editProject,
  onSubmit: onSubmitProject,
}: ProjectFormProps) {
  const isEdit = editProject !== null;

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onSubmit: projectSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmitProject(value);
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editProject
          ? { name: editProject.name, description: editProject.description }
          : { name: "", description: "" },
      );
    }
  }, [open, editProject, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the project name or description."
              : "Create a project to organize tickets on its own board."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="project-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Forge web app"
                      autoComplete="off"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={formatErrors(field.state.meta.errors)} />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional context for this project…"
                      rows={3}
                      spellCheck={false}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={formatErrors(field.state.meta.errors)} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="project-form">
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
