import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import authService from "../services/auth-service";
import {
  LoginResponse,
  LoginValues,
  LogoutResponse,
  RegisterResponse,
  RegisterValues,
} from "../types";
import { toast } from "sonner";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };

  return useMutation<LoginResponse, Error, LoginValues>({
    mutationFn: ({ email, password }: LoginValues) =>
      authService.login(email, password),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Logged in successfully");
      await navigate({ to: search.redirect ?? "/dev-board" });
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });
}

export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation<RegisterResponse, Error, RegisterValues>({
    mutationFn: ({ email, password, name }: RegisterValues) =>
      authService.register(email, password, name),
    onSuccess: async () => {
      toast.success("Account created successfully!");
      await navigate({ to: "/login" });
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
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
