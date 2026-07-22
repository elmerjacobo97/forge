import "server-only";

import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { runUptimeChecks } from "./run-checks";

export type RunChecksHandlerDeps = {
  createAdminClient?: typeof createInsForgeAdminClient;
};

function isAuthorized(request: Request): boolean {
  const token = process.env.CRON_TOKEN;
  if (!token) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${token}`;
}

export async function handleUptimeRunRequest(
  request: Request,
  deps: RunChecksHandlerDeps = {},
): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const createAdmin = deps.createAdminClient ?? createInsForgeAdminClient;

  let admin: ReturnType<typeof createInsForgeAdminClient>;
  try {
    admin = createAdmin();
  } catch {
    return Response.json({ error: "misconfigured" }, { status: 503 });
  }

  const summary = await runUptimeChecks({ database: admin.database });
  return Response.json(summary, { status: 200 });
}
