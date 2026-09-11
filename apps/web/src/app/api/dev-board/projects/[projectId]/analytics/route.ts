import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { devBoardAnalyticsService } from "@/features/dev-board/services/dev-board-analytics-service";

const paramsSchema = z.object({ projectId: z.uuid() });
const querySchema = z.object({ from: z.iso.datetime(), to: z.iso.datetime() });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view Dev Board." }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }

  const url = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  try {
    const analytics = await devBoardAnalyticsService.fetchAnalytics(
      parsedParams.data.projectId,
      parsedQuery.data,
    );
    return NextResponse.json({ analytics });
  } catch {
    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }
}
