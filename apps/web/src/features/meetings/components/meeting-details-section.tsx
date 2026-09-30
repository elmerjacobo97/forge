"use client";

import { FieldGroup, Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/features/dev-board/types/project";
import type { MeetingFormApi } from "../hooks/use-meeting-form";

export function MeetingDetailsSection({
  form,
  projects,
}: {
  form: MeetingFormApi;
  projects: Project[];
}) {
  return (
    <section
      aria-labelledby="meeting-details-heading"
      className="space-y-5"
    >
      <h2
        id="meeting-details-heading"
        className="sr-only"
      >
        Meeting details
      </h2>
      <FieldGroup className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Meeting title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="e.g. Product sync — September 26"
                  maxLength={200}
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  className="h-11 font-heading text-lg"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="meetingAt">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Date and time</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  required
                  aria-invalid={isInvalid}
                  className="h-11 tabular-nums"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="projectId">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field
                data-invalid={isInvalid}
                className="sm:col-span-2"
              >
                <FieldLabel htmlFor={field.name}>
                  Project <span className="font-normal text-muted-foreground">· optional</span>
                </FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full sm:max-w-md"
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
    </section>
  );
}
