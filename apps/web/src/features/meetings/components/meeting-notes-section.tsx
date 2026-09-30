"use client";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { MeetingFormApi } from "../hooks/use-meeting-form";

export function MeetingNotesSection({ form }: { form: MeetingFormApi }) {
  return (
    <section
      aria-labelledby="meeting-context-heading"
      className="space-y-5 border-t border-border/70 pt-6"
    >
      <h2
        id="meeting-context-heading"
        className="sr-only"
      >
        Meeting notes
      </h2>
      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <form.Field name="attendees">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Attendees <span className="font-normal text-muted-foreground">· optional</span>
                </FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="One name per line"
                  rows={3}
                  aria-invalid={isInvalid}
                  className="resize-y"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="decisions">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Decisions{" "}
                  <span className="font-normal text-muted-foreground">· one per line</span>
                </FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="What did the group decide?"
                  rows={3}
                  aria-invalid={isInvalid}
                  className="resize-y"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="context">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field
                data-invalid={isInvalid}
                className="sm:col-span-2"
              >
                <FieldLabel htmlFor={field.name}>Context and notes</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Capture the context worth remembering…"
                  rows={7}
                  aria-invalid={isInvalid}
                  className="min-h-40 resize-y leading-relaxed"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
    </section>
  );
}
