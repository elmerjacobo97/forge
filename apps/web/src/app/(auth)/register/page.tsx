import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an account for your Forge developer workspace.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
