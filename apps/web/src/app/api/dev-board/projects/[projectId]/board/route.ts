import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";

const paramsSchema = z.object({ projectId: z.uuid() });

export async function GET(
  _request: Request,
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

  try {
    const columns = await devBoardService.fetchBoardPages(parsedParams.data.projectId);
    return NextResponse.json({ columns });
  } catch {
    return NextResponse.json({ error: "Failed to load tickets." }, { status: 500 });
  }
}
