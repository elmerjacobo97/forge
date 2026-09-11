"use client";

import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
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
          <span>{error.message || "Unexpected error."}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="w-fit"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
