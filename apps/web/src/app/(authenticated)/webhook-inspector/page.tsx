import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/server";
import { WebhookInspector } from "@/features/webhook-inspector/webhook-inspector";
import { webhookInspectorService } from "@/features/webhook-inspector/services/webhook-inspector-service";

export default async function WebhookInspectorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const endpoints = await webhookInspectorService.listEndpoints(user.id);

  return <WebhookInspector initialEndpoints={endpoints} />;
}
