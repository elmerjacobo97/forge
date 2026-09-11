import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";
import { COLUMNS, type ColumnId } from "@/features/dev-board/types/board";

const paramsSchema = z.object({ projectId: z.uuid() });

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
  const column = url.searchParams.get("column");
  const cursor = url.searchParams.get("cursor");

  if (!column || !(COLUMNS as readonly string[]).includes(column)) {
    return NextResponse.json({ error: "Invalid column." }, { status: 400 });
  }
  if (cursor !== null && !/^\d+$/.test(cursor)) {
    return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
  }

  try {
    const page = await devBoardService.fetchTicketPage(
      parsedParams.data.projectId,
      column as ColumnId,
      cursor,
    );
    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "Failed to load tickets." }, { status: 500 });
  }
}
