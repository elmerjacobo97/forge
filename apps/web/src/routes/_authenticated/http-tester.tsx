import { createFileRoute } from "@tanstack/react-router";

import { HttpTester } from "@/features/http-tester/http-tester.tsx";

export const Route = createFileRoute("/_authenticated/http-tester")({
  component: HttpTester,
});
