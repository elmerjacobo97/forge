import { Outlet, createFileRoute, redirect, isRedirect } from "@tanstack/react-router";
import { userQueryOptions } from "@/features/auth/hooks/queries";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(userQueryOptions);
      throw redirect({ to: "/dev-board" });
    } catch (err) {
      if (isRedirect(err)) {
        throw err;
      }
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Outlet />
    </div>
  );
}
