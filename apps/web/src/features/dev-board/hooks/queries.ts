import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";

import { devBoardAnalyticsService } from "../services/dev-board-analytics-service";
import { devBoardService } from "../services/dev-board-service";
import { projectsService } from "../services/projects-service";
import type { AnalyticsRange } from "../types/analytics";
import { COLUMNS, type ColumnId } from "../types/board";

export const devBoardKeys = {
  all: ["dev-board"] as const,
  user: (userId: string) => [...devBoardKeys.all, userId] as const,
  projects: (userId: string) => [...devBoardKeys.user(userId), "projects"] as const,
  project: (userId: string, projectId: string) =>
    [...devBoardKeys.user(userId), "project", projectId] as const,
  column: (userId: string, projectId: string, column: ColumnId) =>
    [...devBoardKeys.project(userId, projectId), column] as const,
  analytics: (userId: string, projectId: string, from: string, to: string) =>
    [...devBoardKeys.project(userId, projectId), "analytics", from, to] as const,
};

export const devBoardMutationKeys = {
  update: ["dev-board", "update"] as const,
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && (COLUMNS as readonly string[]).includes(value);
}

export function isColumnQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey.length === 5 && queryKey[2] === "project" && isColumnId(queryKey[4]);
}

export function useDevBoardProjects(userId: string | undefined) {
  return useQuery({
    queryKey: devBoardKeys.projects(userId ?? "anonymous"),
    queryFn: () => projectsService.listProjects(userId!),
    enabled: Boolean(userId),
  });
}

export function useDevBoardProject(userId: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: devBoardKeys.project(userId ?? "anonymous", projectId ?? "missing"),
    queryFn: () => projectsService.getProject(projectId!, userId!),
    enabled: Boolean(userId && projectId),
  });
}

export function useDevBoardTickets(
  userId: string | undefined,
  projectId: string | undefined,
  column: ColumnId,
) {
  return useInfiniteQuery({
    queryKey: devBoardKeys.column(userId ?? "anonymous", projectId ?? "missing", column),
    queryFn: ({ pageParam }) =>
      devBoardService.fetchTicketPage(userId!, projectId!, column, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: Boolean(userId && projectId),
  });
}

export function useDevBoardAnalytics(
  userId: string | undefined,
  projectId: string | undefined,
  range: AnalyticsRange | undefined,
) {
  return useQuery({
    queryKey: devBoardKeys.analytics(
      userId ?? "anonymous",
      projectId ?? "missing",
      range?.from ?? "incomplete",
      range?.to ?? "incomplete",
    ),
    queryFn: () => {
      if (!range) throw new Error("Select a complete date range.");
      return devBoardAnalyticsService.fetchAnalytics(userId!, projectId!, range);
    },
    enabled: Boolean(userId && projectId && range),
  });
}

export function useDevBoardRealtime(userId: string | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: devBoardKeys.user(userId) });
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [queryClient, userId]);
}
