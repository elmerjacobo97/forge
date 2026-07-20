import { receiveWebhookRequest } from "@/features/webhook-inspector/server/receive-webhook";

type RouteContext = {
  params: Promise<{ token: string }>;
};

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { token } = await context.params;
  return receiveWebhookRequest(request, token);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
