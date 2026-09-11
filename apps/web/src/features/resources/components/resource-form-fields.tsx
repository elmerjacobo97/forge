import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AiGenerationButton } from "@/features/ai-generation/components/ai-generation-button";
import { FORMATS, TOOLS } from "../constants";
import type { ResourceSchema } from "../schemas/resource-schema";

type ResourceFormFieldApi = {
  name: string;
  state: {
    value: string;
    meta: { isTouched: boolean; isValid: boolean; errors: Array<{ message?: string } | undefined> };
  };
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

export type ResourceFormApi = {
  Field: (props: {
    name: keyof ResourceSchema;
    children: (field: ResourceFormFieldApi) => React.ReactNode;
  }) => React.ReactNode | Promise<React.ReactNode>;
};

type ResourceFormFieldsProps = {
  form: ResourceFormApi;
  isConfig: boolean;
  selectedTool: string;
  generationTitle: string;
  isGenerating: boolean;
  onGenerate: (title: string) => void;
};

export function ResourceFormFields({
  form,
  isConfig,
  selectedTool,
  generationTitle,
  isGenerating,
  onGenerate,
}: ResourceFormFieldsProps) {
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
                placeholder="e.g. System prompt for code review"
                autoComplete="off"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="kind">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val as ResourceSchema["kind"])}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="prompt">Prompt</SelectItem>
                    <SelectItem value="config">Config</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="language">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Format</FieldLabel>
                <Select
                  value={field.state.value || undefined}
                  onValueChange={(value) => field.handleChange(value)}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((format) => (
                      <SelectItem
                        key={format.value}
                        value={format.value}
                      >
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      {isConfig ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="tool">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Tool</FieldLabel>
                    <Select
                      value={field.state.value || undefined}
                      onValueChange={(value) => field.handleChange(value as ResourceSchema["tool"])}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOLS.map((tool) => (
                          <SelectItem
                            key={tool.value}
                            value={tool.value}
                          >
                            {tool.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="version">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Version</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. 0.75 (optional)"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {selectedTool === "other" ? (
            <form.Field name="customTool">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Custom tool name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Zed"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          ) : null}

          <form.Field name="context">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Context</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="How or where this configuration is used (optional)"
                      rows={3}
                      className="min-h-20 max-h-48 resize-y overflow-y-auto"
                      aria-invalid={isInvalid}
                    />
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </>
      ) : null}

      <form.Field name="content">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Content</FieldLabel>
              <InputGroup className="overflow-hidden">
                <InputGroupTextarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Paste or type your content here…"
                  rows={8}
                  className="min-h-52 max-h-52 overflow-y-auto font-mono resize-none"
                  aria-invalid={isInvalid}
                />
                <InputGroupAddon
                  align="block-end"
                  className="justify-end"
                >
                  <AiGenerationButton
                    label="Generate resource details with AI"
                    disabled={generationTitle.trim().length < 2}
                    onClick={() => onGenerate(generationTitle)}
                    isGenerating={isGenerating}
                  />
                </InputGroupAddon>
              </InputGroup>
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
                placeholder="prompt, review, yaml"
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
    </FieldGroup>
  );
}
