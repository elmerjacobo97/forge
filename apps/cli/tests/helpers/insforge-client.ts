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
