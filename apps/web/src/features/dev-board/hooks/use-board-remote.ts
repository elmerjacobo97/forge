import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import { type ColumnId, type ColumnPage, type Ticket } from "../types/board";
import { appendTickets, toColumnRecord, type ColumnRecord } from "../utils/board-state";

export function useBoardRemote(
  projectId: string,
  columns: ColumnRecord,
  setColumns: Dispatch<SetStateAction<ColumnRecord>>,
) {
  const [loadingColumns, setLoadingColumns] = useState<Partial<Record<ColumnId, boolean>>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadMore(column: ColumnId) {
    const cursor = columns[column].nextCursor;
    if (!cursor) return;

    setLoadingColumns((current) => ({ ...current, [column]: true }));

    try {
      const response = await fetch(
        `/api/dev-board/projects/${projectId}/tickets?column=${column}&cursor=${cursor}`,
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to load more tickets.");
      }

      const body = (await response.json()) as {
        tickets: Ticket[];
        nextCursor: string | null;
        total: number;
      };
      setColumns((current) =>
        appendTickets(current, column, body.tickets, body.nextCursor, body.total),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load more tickets.");
    } finally {
      setLoadingColumns((current) => ({ ...current, [column]: false }));
    }
  }

  async function refreshBoard() {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/dev-board/projects/${projectId}/board`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to refresh board.");
      }

      const body = (await response.json()) as { columns: ColumnPage[] };
      setColumns(toColumnRecord(body.columns));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh board.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return { loadingColumns, isRefreshing, loadMore, refreshBoard };
}
