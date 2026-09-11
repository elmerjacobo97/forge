import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";

const paramsSchema = z.object({ ticketId: z.uuid() });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view Dev Board." }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });
  }

  try {
    const comments = await devBoardService.listComments(parsedParams.data.ticketId);
    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof Error && error.message === "Ticket not found.") {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load comments." }, { status: 500 });
  }
}
