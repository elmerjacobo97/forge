import { useEffect } from "react";
import { Channel, Query, Realtime } from "appwrite";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/appwrite";

import { devBoardService } from "../services/dev-board-service";
import type { ColumnId } from "../types";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;

export const devBoardKeys = {
  all: ["dev-board"] as const,
  user: (userId: string) => [...devBoardKeys.all, userId] as const,
  column: (userId: string, column: ColumnId) => [...devBoardKeys.user(userId), column] as const,
};

export const devBoardMutationKeys = {
  update: ["dev-board", "update"] as const,
};

export function useDevBoardTickets(userId: string | undefined, column: ColumnId) {
  return useInfiniteQuery({
    queryKey: devBoardKeys.column(userId ?? "anonymous", column),
    queryFn: ({ pageParam }) => devBoardService.fetchTicketPage(userId!, column, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: Boolean(userId),
  });
}

export function useDevBoardRealtime(userId: string | undefined): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId || !databaseId || !tableId) return;

    const realtime = new Realtime(client);
    let cancelled = false;
    let unsubscribe: (() => Promise<void>) | undefined;
    void realtime
      .subscribe(
        Channel.tablesdb(databaseId).table(tableId).row(),
        () => {
          if (queryClient.isMutating({ mutationKey: devBoardMutationKeys.update }) > 0) return;
          void queryClient.invalidateQueries({ queryKey: devBoardKeys.user(userId) });
        },
        [Query.equal("userId", [userId])],
      )
      .then((subscription) => {
        unsubscribe = subscription.unsubscribe;
        if (cancelled) void unsubscribe();
      })
      .catch((error: unknown) => console.error("Dev Board Realtime subscription failed:", error));

    return () => {
      cancelled = true;
      if (unsubscribe) void unsubscribe();
    };
  }, [queryClient, userId]);
}
