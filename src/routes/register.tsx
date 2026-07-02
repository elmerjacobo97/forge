import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";

export const Route = createFileRoute("/register")({
  component: RegisterScreen,
});

function RegisterScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <RegisterForm />
    </div>
  );
}
