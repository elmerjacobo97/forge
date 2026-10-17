import type { InsForgeClient } from "@insforge/sdk";

type Row = Record<string, unknown>;

/** In-memory InsForge stand-in: eq filters, insert, update, delete, single/maybeSingle. */
export function createTableClient(initial: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = structuredClone(initial);
  let nextId = 1;

  function builder(table: string): unknown {
    const filters: Array<[string, unknown]> = [];
    let action: "select" | "update" | "delete" = "select";
    let patch: Row = {};
    let inserted: Row[] | null = null;

    const matching = () =>
      (tables[table] ?? []).filter((row) => filters.every(([key, value]) => row[key] === value));

    const run = () => {
      if (inserted) return { data: inserted, error: null };
      const rows = matching();
      if (action === "update") rows.forEach((row) => Object.assign(row, patch));
      if (action === "delete")
        tables[table] = (tables[table] ?? []).filter((r) => !rows.includes(r));
      return { data: rows, error: null };
    };

    const proxy: unknown = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            return (resolve: (value: unknown) => unknown) => Promise.resolve(run()).then(resolve);
          }
          return (...args: unknown[]) => {
            if (prop === "eq") filters.push([args[0] as string, args[1]]);
            if (prop === "update") {
              action = "update";
              patch = args[0] as Row;
            }
            if (prop === "delete") action = "delete";
            if (prop === "insert") {
              inserted = (args[0] as Row[]).map((row) => ({
                id: `id-${nextId++}`,
                description: "",
                updated_at: "2026-10-17T00:00:00.000Z",
                ...row,
              }));
              tables[table] = [...(tables[table] ?? []), ...inserted];
            }
            if (prop === "maybeSingle" || prop === "single") {
              return Promise.resolve({ data: run().data[0] ?? null, error: null });
            }
            return proxy;
          };
        },
      },
    );
    return proxy;
  }

  const client = { database: { from: builder } } as unknown as InsForgeClient;
  return { client, tables };
}
