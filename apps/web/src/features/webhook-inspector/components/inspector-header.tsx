"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WEBHOOK_MAX_ENDPOINTS_PER_USER } from "../constants";

export function InspectorHeader({
  activeCount,
  atLimit,
  onCreate,
}: {
  activeCount: number;
  atLimit: boolean;
  onCreate: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-medium tracking-tight">Webhook endpoints</h1>
          <p className="text-xs text-muted-foreground">
            Create temporary URLs that capture and inspect incoming HTTP requests. {activeCount}/
            {WEBHOOK_MAX_ENDPOINTS_PER_USER} active.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onCreate}
          disabled={atLimit}
          title={
            atLimit
              ? `You can have at most ${WEBHOOK_MAX_ENDPOINTS_PER_USER} active endpoints.`
              : undefined
          }
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          Create
        </Button>
      </div>

      {atLimit ? (
        <Alert>
          <AlertTitle>Active endpoint limit reached</AlertTitle>
          <AlertDescription>
            Delete or wait for an endpoint to expire before creating another (max{" "}
            {WEBHOOK_MAX_ENDPOINTS_PER_USER} active).
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
