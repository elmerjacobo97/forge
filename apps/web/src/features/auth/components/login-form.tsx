"use client";

import { useState, useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, SquareLock01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

import { signInAction, signInWithGitHubAction } from "@/features/auth/actions";
import { GitHubIcon } from "@/components/brand-icons/github-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { loginSchema } from "../schemas/auth-schema";

const oauthErrorMessages: Record<string, string> = {
  github_cancelled: "GitHub sign-in was cancelled.",
  github_email_unverified:
    "GitHub did not provide a verified email address. Choose an account with a verified email or sign in with email and password.",
  oauth_failed: "GitHub sign-in failed. Please try again.",
};

export function LoginForm({
  redirectTo,
  oauthError,
}: {
  redirectTo?: string;
  oauthError?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isOAuthPending, startOAuthTransition] = useTransition();
  const oauthErrorMessage = oauthError
    ? (oauthErrorMessages[oauthError] ?? oauthErrorMessages.oauth_failed)
    : null;

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        setError(null);
        const result = await signInAction(value, redirectTo);
        if (!result.ok) setError(result.message);
      });
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in to Forge</CardTitle>
        <CardDescription>Authenticate to access your dev toolkit and saved data.</CardDescription>
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
          <FieldGroup>
            {error || oauthErrorMessage ? (
              <p
                className="text-sm text-destructive"
                role="alert"
              >
                {error ?? oauthErrorMessage}
              </p>
            ) : null}
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <HugeiconsIcon
                            icon={Mail01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
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
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <HugeiconsIcon
                            icon={SquareLock01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isPending}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          disabled={isPending}
                        >
                          {showPassword ? (
                            <HugeiconsIcon
                              icon={ViewOffIcon}
                              strokeWidth={2}
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={ViewIcon}
                              strokeWidth={2}
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <div className="grid w-full gap-3">
          <Field orientation="horizontal">
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={isPending || isOAuthPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </Field>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending || isOAuthPending}
            onClick={() => {
              setError(null);
              startOAuthTransition(async () => {
                const result = await signInWithGitHubAction(redirectTo);
                if (!result.ok) setError(result.message);
              });
            }}
          >
            {isOAuthPending ? (
              "Connecting to GitHub..."
            ) : (
              <>
                <GitHubIcon className="size-4" />
                <span>Continue with GitHub</span>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
