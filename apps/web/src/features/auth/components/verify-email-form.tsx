"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import {
  resendVerificationAction,
  verifyEmailAction,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function VerifyEmailForm({ email }: { email: string }) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function verify() {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await verifyEmailAction({ email, otp });
      if (!result.ok) setError(result.message);
    });
  }

  function resend() {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await resendVerificationAction(email);
      if (result.ok) setMessage("A new verification code was sent.");
      else setError(result.message);
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MailCheck className="size-4" aria-hidden="true" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="verify-email-form"
          onSubmit={(event) => {
            event.preventDefault();
            verify();
          }}
        >
          <Field>
            <FieldLabel htmlFor="verification-code">Verification code</FieldLabel>
            <Input
              id="verification-code"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-[0.35em]"
              aria-invalid={error !== null}
              disabled={isPending}
              required
              autoFocus
            />
          </Field>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="verify-email-form"
          className="w-full"
          disabled={isPending || otp.length !== 6}
        >
          {isPending ? "Verifying..." : "Verify email"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resend} disabled={isPending}>
          Resend code
        </Button>
        <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground">
          Use a different email
        </Link>
      </CardFooter>
    </Card>
  );
}
