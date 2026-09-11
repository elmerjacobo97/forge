import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { latencyRangeSchema } from "@/features/uptime-monitor/schemas/uptime-monitor-schema";
import { uptimeMonitorService } from "@/features/uptime-monitor/services/uptime-monitor-service";

const paramsSchema = z.object({ monitorId: z.uuid() });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ monitorId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to use Uptime Monitor." }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid monitor." }, { status: 400 });
  }

  const range = new URL(request.url).searchParams.get("range");
  const parsedRange = latencyRangeSchema.safeParse(range);
  if (!parsedRange.success) {
    return NextResponse.json({ error: "Invalid latency range." }, { status: 400 });
  }

  try {
    const detail = await uptimeMonitorService.getMonitorDetail(
      parsedParams.data.monitorId,
      parsedRange.data,
      user.id,
    );
    return NextResponse.json({ detail });
  } catch {
    return NextResponse.json({ error: "Failed to load monitor detail." }, { status: 500 });
  }
}
