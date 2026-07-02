import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Lock, Mail, User } from "lucide-react";

import { useRegisterMutation } from "@/features/auth/hooks/mutations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const formatErrors = (errors: any[]) => {
  return errors.map((err) => {
    if (typeof err === "string") return { message: err };
    if (err && typeof err === "object" && "message" in err) {
      return { message: String(err.message) };
    }
    return { message: err?.toString() || "Invalid value" };
  });
};

export function RegisterForm() {
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const registerMutation = useRegisterMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      const { name, email, password } = value;
      registerMutation.mutate(
        { name, email, password },
        {
          onSuccess: () => {
            setRegisterError(null);
            navigate({ to: "/dev-board" });
          },
          onError: (err: any) => {
            setRegisterError(
              err?.message ||
                "An error occurred during registration. Please try again.",
            );
          },
        },
      );
    },
  });

  const isPending = registerMutation.isPending;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Sign up to save bookmarks, dev-board tickets, and configurations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="register-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {registerError && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive leading-normal border border-destructive/20">
              {registerError}
            </div>
          )}
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <User className="size-3.5" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="John Doe"
                        autoComplete="name"
                        disabled={isPending}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        errors={formatErrors(field.state.meta.errors)}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Mail className="size-3.5" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="you@work.dev"
                        autoComplete="email"
                        disabled={isPending}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        errors={formatErrors(field.state.meta.errors)}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Lock className="size-3.5" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        disabled={isPending}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        errors={formatErrors(field.state.meta.errors)}
                      />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="confirmPassword"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <Lock className="size-3.5" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        disabled={isPending}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError
                        errors={formatErrors(field.state.meta.errors)}
                      />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button
          type="submit"
          form="register-form"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
