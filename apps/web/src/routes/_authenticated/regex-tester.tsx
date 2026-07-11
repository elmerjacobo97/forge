import { createFileRoute } from "@tanstack/react-router";

import { RegexTester } from "@/features/regex-tester/regex-tester.tsx";

export const Route = createFileRoute("/_authenticated/regex-tester")({
  component: RegexTester,
});
