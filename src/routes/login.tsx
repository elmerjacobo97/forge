import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Lock, Mail } from "lucide-react";

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
  InputGroup,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginValues = z.infer<typeof loginSchema>;

const searchSchema = z.object({
  redirect: z.string().optional(),
});

function LoginScreen() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const { auth } = Route.useRouteContext();

  const form = useForm<LoginValues>({
    // @ts-expect-error — Zod v4 + @hookform/resolvers type mismatch on TS 5.x
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: LoginValues) {
    await auth.login(values.email, values.password);
    const target = search.redirect ?? "/dev-board";
    await navigate({ to: target });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Forge</CardTitle>
          <CardDescription>
            Authenticate to access your dev toolkit and saved data.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <InputGroup>
                      <InputGroupText>
                        <Mail className="size-3.5" />
                      </InputGroupText>
                      <InputGroupInput
                        {...field}
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@work.dev"
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-pw">Password</FieldLabel>
                    <InputGroup>
                      <InputGroupText>
                        <Lock className="size-3.5" />
                      </InputGroupText>
                      <InputGroupInput
                        {...field}
                        id="login-pw"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginScreen,
});