import { handleUptimeRunRequest } from "@/features/uptime-monitor/server/run-checks-handler";

export async function POST(request: Request): Promise<Response> {
  return handleUptimeRunRequest(request);
}
