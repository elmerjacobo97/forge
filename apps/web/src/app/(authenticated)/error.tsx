"use client";

import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AuthenticatedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Alert
        variant="destructive"
        className="max-w-md"
      >
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>This page could not finish loading.</span>
          {error.digest ? (
            <span className="font-mono text-xs">Reference {error.digest}</span>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => unstable_retry()}
            className="w-fit"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
