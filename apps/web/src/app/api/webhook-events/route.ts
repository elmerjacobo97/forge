import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { webhookInspectorService } from "@/features/webhook-inspector/services/webhook-inspector-service";

const querySchema = z.object({ endpointId: z.uuid() });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to use Webhook Inspector." }, { status: 401 });
  }

  const endpointId = new URL(request.url).searchParams.get("endpointId");
  const parsed = querySchema.safeParse({ endpointId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook endpoint." }, { status: 400 });
  }

  try {
    const events = await webhookInspectorService.listEvents(parsed.data.endpointId, user.id);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Failed to load webhook events." }, { status: 500 });
  }
}
