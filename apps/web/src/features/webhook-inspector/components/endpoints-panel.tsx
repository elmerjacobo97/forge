"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, WebhookIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { WebhookEndpoint } from "../types";
import { EndpointRow } from "./endpoint-row";

export function EndpointsPanel({
  endpoints,
  activeEndpointId,
  onCreate,
  onSelect,
  onDelete,
}: {
  endpoints: WebhookEndpoint[];
  activeEndpointId: string | null;
  onCreate: () => void;
  onSelect: (endpoint: WebhookEndpoint) => void;
  onDelete: (endpoint: WebhookEndpoint) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Endpoints</Label>
      <div className="min-h-0 flex-1 overflow-y-auto border border-input/60 bg-muted/20 p-2">
        {endpoints.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <HugeiconsIcon
              icon={WebhookIcon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/40"
            />
            <p className="text-sm font-medium">No webhook endpoints yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create an endpoint to get a public URL that captures incoming HTTP requests.
            </p>
            <Button
              size="sm"
              onClick={onCreate}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Create endpoint
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {endpoints.map((endpoint) => (
              <EndpointRow
                key={endpoint.id}
                endpoint={endpoint}
                selected={endpoint.id === activeEndpointId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
