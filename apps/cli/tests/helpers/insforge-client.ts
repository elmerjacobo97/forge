import type { InsForgeClient } from "@insforge/sdk";
import { vi } from "vitest";

export function createListClient(data: unknown) {
  const response = { data, error: null };
  const range = vi.fn().mockResolvedValue(response);
  const ordered = Object.assign(Promise.resolve(response), { range });
  const order = vi.fn(() => ordered);
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { client: { database: { from } } as unknown as InsForgeClient, range };
}

type Row = Record<string, unknown>;

export interface MockResponse {
  data: unknown;
  error: unknown;
}

export interface DevBoardMockOptions {
  tickets?: Row[];
  projects?: Row[];
  comments?: Row[];
  rpc?: (name: string, params: Record<string, unknown>) => MockResponse;
}

export interface DevBoardMockCall {
  table: string;
  method: string;
  args: unknown[];
}

export function createDevBoardMockClient(options: DevBoardMockOptions = {}) {
  const calls: DevBoardMockCall[] = [];
  const rpcCalls: Array<{ name: string; params: Record<string, unknown> }> = [];

  function rowsFor(table: string): Row[] {
    if (table === "dev_board_tickets") return options.tickets ?? [];
    if (table === "dev_board_projects") return options.projects ?? [];
    if (table === "dev_board_ticket_comments") return options.comments ?? [];
    return [];
  }

  function builder(table: string): unknown {
    const conditions: Array<[string, unknown]> = [];
    let insertedRows: Row[] | null = null;

    const response = (): MockResponse => {
      let rows = insertedRows ?? rowsFor(table);
      for (const [key, value] of conditions) {
        rows = rows.filter((row) => row[key] === value);
      }
      return { data: rows, error: null };
    };

    const proxy: unknown = new Proxy(
      {},
      {
        get(_target: object, prop: string | symbol) {
          if (prop === "then") {
            return (resolve: (value: unknown) => unknown) =>
              Promise.resolve(response()).then(resolve);
          }
          const method = String(prop);
          return (...args: unknown[]) => {
            calls.push({ table, method, args });
            if (prop === "insert") {
              const rows = (args[0] as Row[] | undefined) ?? [];
              insertedRows = rows.map((row, index) => ({
                id: row.id ?? `inserted-${index + 1}`,
                created_at: row.created_at ?? "2026-09-01T00:00:00.000Z",
                ...row,
              }));
              return proxy;
            }
            if (prop === "eq") {
              conditions.push(args as [string, unknown]);
              return proxy;
            }
            if (prop === "maybeSingle" || prop === "single") {
              const rows = response().data as Row[];
              return Promise.resolve({ data: rows[0] ?? null, error: null });
            }
            return proxy;
          };
        },
      },
    );
    return proxy;
  }

  const client = {
    database: {
      from: (table: string) => builder(table),
      rpc: (name: string, params: Record<string, unknown>) => {
        rpcCalls.push({ name, params });
        if (options.rpc) return Promise.resolve(options.rpc(name, params));
        return Promise.resolve({ data: null, error: null });
      },
    },
  } as unknown as InsForgeClient;

  return { client, calls, rpcCalls };
}
