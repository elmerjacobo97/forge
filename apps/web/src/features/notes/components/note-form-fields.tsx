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
import { NO_PROJECT, type NoteSchema } from "../schemas/note-schema";
import type { NoteProject } from "../types";

type NoteFormFieldApi = {
  name: string;
  state: {
    value: string;
    meta: { isTouched: boolean; isValid: boolean; errors: Array<{ message?: string } | undefined> };
  };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

export type NoteFormApi = {
  Field: (props: {
    name: keyof NoteSchema;
    children: (field: NoteFormFieldApi) => React.ReactNode;
  }) => React.ReactNode | Promise<React.ReactNode>;
};

export function NoteFormFields({ form, projects }: { form: NoteFormApi; projects: NoteProject[] }) {
  return (
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
                placeholder="e.g. Expo SDK 52: router setup differs from the docs"
                autoComplete="off"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="projectId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Project</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={field.handleChange}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No project (global)</SelectItem>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Field name="content">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Content (markdown)</FieldLabel>
              <InputGroup className="overflow-hidden">
                <InputGroupTextarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="What you learned, the config that worked, or the decision you made…"
                  rows={8}
                  className="min-h-48 max-h-64 resize-none overflow-y-auto font-mono"
                  aria-invalid={isInvalid}
                />
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
              placeholder="expo, rn-0.76, config"
            />
          </Field>
        )}
      </form.Field>
    </FieldGroup>
  );
}
