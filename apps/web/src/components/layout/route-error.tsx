"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type RouteErrorBoundaryProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

type RouteErrorProps = RouteErrorBoundaryProps & {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export function RouteError({
  error,
  unstable_retry,
  title,
  description,
  backHref,
  backLabel = "Back",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Alert
        variant="destructive"
        className="max-w-md"
      >
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{description}</span>
          {error.digest ? (
            <span className="font-mono text-xs">Reference {error.digest}</span>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={unstable_retry}
              className="w-fit"
            >
              Try again
            </Button>
            {backHref ? (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="w-fit"
              >
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
