import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterForm,
});
