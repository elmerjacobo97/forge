import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Lock, Mail } from "lucide-react";

import { useLoginMutation } from "@/features/auth/hooks/mutations";
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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
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

export function LoginForm() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value, {
        onSuccess: () => {
          setLoginError(null);
          const target = search.redirect ?? "/dev-board";
          navigate({ to: target });
        },
        onError: (err: any) => {
          setLoginError(
            err?.message || "An error occurred during login. Please try again.",
          );
        },
      });
    },
  });

  const isPending = loginMutation.isPending;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in to Forge</CardTitle>
        <CardDescription>
          Authenticate to access your dev toolkit and saved data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {loginError && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive leading-normal border border-destructive/20">
              {loginError}
            </div>
          )}
          <FieldGroup>
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
                        placeholder="••••••••"
                        autoComplete="current-password"
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
          form="login-form"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
        <div className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
