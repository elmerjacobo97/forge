import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import authService from "../services/auth-service";
import { LoginResponse, LoginValues, LogoutResponse } from "../types";
import { toast } from "sonner";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginValues>({
    mutationFn: ({ email, password }: LoginValues) =>
      authService.login(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LogoutResponse, Error>({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(["session"], null);
      toast.success("Logged out successfully");
      await navigate({ to: "/login" });
    },
    onError: (error) => {
      toast.error(error.message || "Logout failed");
    },
  });
}
