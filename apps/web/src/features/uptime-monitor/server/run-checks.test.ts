import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runUptimeChecks } from "./run-checks";

type Row = Record<string, unknown>;

/** Minimal in-memory stand-in for the InsForge/PostgREST query builder, just
 * enough of the chain (select/eq/is/lt/order/limit/insert/update/delete +
 * maybeSingle/await) for run-checks.ts's queries. */
function createFakeDatabase(seed: {
  uptime_monitors?: Row[];
  uptime_checks?: Row[];
  uptime_incidents?: Row[];
  uptime_notification_settings?: Row[];
}) {
  const tables: Record<string, Row[]> = {
    uptime_monitors: seed.uptime_monitors ? [...seed.uptime_monitors] : [],
    uptime_checks: seed.uptime_checks ? [...seed.uptime_checks] : [],
    uptime_incidents: seed.uptime_incidents ? [...seed.uptime_incidents] : [],
    uptime_notification_settings: seed.uptime_notification_settings
      ? [...seed.uptime_notification_settings]
      : [],
  };
  let nextId = 1;

  function from(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    let sortCol: string | null = null;
    let sortAsc = true;
    let limitN: number | null = null;
    let mode: "select" | "insert" | "update" | "delete" = "select";
    let payload: Row | Row[] | null = null;

    async function execute(): Promise<{ data: unknown; error: null }> {
      const store = tables[table];
      if (mode === "insert") {
        const rows = (Array.isArray(payload) ? payload : [payload]).map((r) => ({
          id: `gen-${nextId++}`,
          ...r,
        }));
        store.push(...rows);
        return { data: rows, error: null };
      }
      if (mode === "update") {
        const matching = store.filter((row) => filters.every((f) => f(row)));
        matching.forEach((row) => Object.assign(row, payload));
        return { data: matching, error: null };
      }
      if (mode === "delete") {
        tables[table] = store.filter((row) => !filters.every((f) => f(row)));
        return { data: null, error: null };
      }
      let result = store.filter((row) => filters.every((f) => f(row)));
      if (sortCol) {
        const col = sortCol;
        result = [...result].sort((a, b) => {
          const av = String(a[col]);
          const bv = String(b[col]);
          if (av === bv) return 0;
          return sortAsc ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
        });
      }
      if (limitN != null) result = result.slice(0, limitN);
      return { data: result, error: null };
    }

    const builder = {
      select() {
        mode = "select";
        return builder;
      },
      insert(rows: Row[]) {
        mode = "insert";
        payload = rows;
        return builder;
      },
      update(patch: Row) {
        mode = "update";
        payload = patch;
        return builder;
      },
      delete() {
        mode = "delete";
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push((row) => row[col] === val);
        return builder;
      },
      is(col: string, val: null) {
        filters.push((row) => (row[col] ?? null) === val);
        return builder;
      },
      lt(col: string, val: string) {
        filters.push((row) => String(row[col]) < val);
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        sortCol = col;
        sortAsc = opts?.ascending ?? true;
        return builder;
      },
      limit(n: number) {
        limitN = n;
        return builder;
      },
      async maybeSingle() {
        const { data } = await execute();
        return { data: Array.isArray(data) ? (data[0] ?? null) : data, error: null };
      },
      then(
        onFulfilled: (value: { data: unknown; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return execute().then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  return { from: from as unknown as never, tables };
}

const monitorBase = {
  id: "m1",
  user_id: "u1",
  name: "My API",
  url: "https://example.com/health",
  method: "GET",
  expected_status: 200,
  interval_minutes: 5,
  failure_threshold: 2,
  enabled: true,
  status: "pending",
  consecutive_failures: 0,
  last_checked_at: null,
};

describe("runUptimeChecks", () => {
  it("only checks enabled monitors whose interval is due", async () => {
    const now = new Date("2026-07-21T00:10:00.000Z");
    const fake = createFakeDatabase({
      uptime_monitors: [
        { ...monitorBase, id: "due", last_checked_at: null },
        {
          ...monitorBase,
          id: "not-due",
          last_checked_at: "2026-07-21T00:09:00.000Z", // 1 min ago, interval 5 min
        },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    const summary = await runUptimeChecks({
      database: fake as never,
      now: () => now,
      fetchImpl,
    });

    expect(summary).toEqual({ checked: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not flip status to down on the first failure below threshold", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 0 }],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));

    await runUptimeChecks({ database: fake as never, fetchImpl });

    const monitor = fake.tables.uptime_monitors[0];
    expect(monitor.status).toBe("up");
    expect(monitor.consecutive_failures).toBe(1);
    expect(fake.tables.uptime_incidents).toHaveLength(0);
  });

  it("flips to down exactly at the failure threshold and opens one incident", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });

    await runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram });

    const monitor = fake.tables.uptime_monitors[0];
    expect(monitor.status).toBe("down");
    expect(monitor.consecutive_failures).toBe(2);
    expect(fake.tables.uptime_incidents).toHaveLength(1);
    expect(fake.tables.uptime_incidents[0].ended_at).toBeUndefined();
    expect(sendTelegram).not.toHaveBeenCalled(); // no settings saved
  });

  it("does not open a second incident or resend the down alert on further failures", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "down", consecutive_failures: 2 }],
      uptime_incidents: [{ id: "inc-1", monitor_id: "m1", started_at: "t0", ended_at: null }],
      uptime_notification_settings: [
        { user_id: "u1", telegram_bot_token: "tok", telegram_chat_id: "chat" },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });

    await runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram });

    const monitor = fake.tables.uptime_monitors[0];
    expect(monitor.status).toBe("down");
    expect(monitor.consecutive_failures).toBe(3);
    expect(fake.tables.uptime_incidents).toHaveLength(1); // no new incident
    expect(sendTelegram).not.toHaveBeenCalled(); // no repeat alert
  });

  it("closes the incident and sends a recovery alert when a down monitor succeeds", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "down", consecutive_failures: 3 }],
      uptime_incidents: [{ id: "inc-1", monitor_id: "m1", started_at: "t0", ended_at: null }],
      uptime_notification_settings: [
        { user_id: "u1", telegram_bot_token: "tok", telegram_chat_id: "chat" },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });

    await runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram });

    const monitor = fake.tables.uptime_monitors[0];
    expect(monitor.status).toBe("up");
    expect(monitor.consecutive_failures).toBe(0);
    expect(fake.tables.uptime_incidents[0].ended_at).toBeTruthy();
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendTelegram).toHaveBeenCalledWith("tok", "chat", expect.stringContaining("recovered"));
  });

  it("sends exactly one down alert through Telegram and Slack on transition", async () => {
    const now = new Date("2026-07-22T12:00:00.000Z");
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
      uptime_notification_settings: [
        {
          user_id: "u1",
          telegram_bot_token: "tok",
          telegram_chat_id: "chat",
          slack_webhook_url: "https://hooks.slack.com/services/T/B/secret",
          slack_enabled: true,
        },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    await runUptimeChecks({
      database: fake as never,
      now: () => now,
      fetchImpl,
      sendTelegram,
      sendSlack,
    });

    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendTelegram).toHaveBeenCalledWith(
      "tok",
      "chat",
      "🔴 My API is down (Unexpected status 500).\nhttps://example.com/health",
    );
    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(sendSlack).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T/B/secret",
      expect.objectContaining({
        text: "🔴 My API is down",
        blocks: expect.any(Array),
      }),
    );
  });

  it("sends a recovery alert through Slack when only Slack is enabled", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "down", consecutive_failures: 3 }],
      uptime_incidents: [{ id: "inc-1", monitor_id: "m1", started_at: "t0", ended_at: null }],
      uptime_notification_settings: [
        {
          user_id: "u1",
          telegram_bot_token: null,
          telegram_chat_id: null,
          slack_webhook_url: "https://hooks.slack.com/services/T/B/secret",
          slack_enabled: true,
        },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    await runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram, sendSlack });

    expect(sendTelegram).not.toHaveBeenCalled();
    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(sendSlack).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T/B/secret",
      expect.objectContaining({ text: "🟢 My API recovered" }),
    );
  });

  it("skips Slack when the channel is disabled or not configured", async () => {
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    const disabled = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
      uptime_notification_settings: [
        {
          user_id: "u1",
          telegram_bot_token: "tok",
          telegram_chat_id: "chat",
          slack_webhook_url: "https://hooks.slack.com/services/T/B/secret",
          slack_enabled: false,
        },
      ],
    });
    await runUptimeChecks({
      database: disabled as never,
      fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
      sendTelegram,
      sendSlack,
    });
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendSlack).not.toHaveBeenCalled();

    sendTelegram.mockClear();
    sendSlack.mockClear();

    const missingWebhook = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
      uptime_notification_settings: [
        {
          user_id: "u1",
          telegram_bot_token: "tok",
          telegram_chat_id: "chat",
          slack_webhook_url: null,
          slack_enabled: true,
        },
      ],
    });
    await runUptimeChecks({
      database: missingWebhook as never,
      fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
      sendTelegram,
      sendSlack,
    });
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendSlack).not.toHaveBeenCalled();
  });

  it("keeps Telegram delivery and completes the run when Slack fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
      uptime_notification_settings: [
        {
          user_id: "u1",
          telegram_bot_token: "tok",
          telegram_chat_id: "chat",
          slack_webhook_url: "https://hooks.slack.com/services/T/B/secret",
          slack_enabled: true,
        },
      ],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: false, message: "invalid_token" });

    await expect(
      runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram, sendSlack }),
    ).resolves.toEqual({ checked: 1 });

    expect(fake.tables.uptime_monitors[0].status).toBe("down");
    expect(sendTelegram).toHaveBeenCalledTimes(1);
    expect(sendSlack).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[uptime-monitor] slack alert failed for My API: invalid_token",
    );
    errorSpy.mockRestore();
  });

  it("records transitions without sending an alert when no notification settings are saved", async () => {
    const fake = createFakeDatabase({
      uptime_monitors: [{ ...monitorBase, status: "up", consecutive_failures: 1 }],
    });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const sendTelegram = vi.fn().mockResolvedValue({ ok: true });
    const sendSlack = vi.fn().mockResolvedValue({ ok: true });

    await expect(
      runUptimeChecks({ database: fake as never, fetchImpl, sendTelegram, sendSlack }),
    ).resolves.toEqual({ checked: 1 });

    expect(fake.tables.uptime_monitors[0].status).toBe("down");
    expect(sendTelegram).not.toHaveBeenCalled();
    expect(sendSlack).not.toHaveBeenCalled();
  });

  it("records a failed check with a descriptive error on network failure", async () => {
    const fake = createFakeDatabase({ uptime_monitors: [{ ...monitorBase }] });
    const fetchImpl = vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    await runUptimeChecks({ database: fake as never, fetchImpl });

    const check = fake.tables.uptime_checks[0];
    expect(check.ok).toBe(false);
    expect(check.status_code).toBeNull();
    expect(check.error).toBe("getaddrinfo ENOTFOUND");
  });

  it("deletes checks older than the retention window on every run", async () => {
    const now = new Date("2026-07-21T00:00:00.000Z");
    const fake = createFakeDatabase({
      uptime_monitors: [],
      uptime_checks: [
        { id: "old", monitor_id: "m1", checked_at: "2026-06-01T00:00:00.000Z" },
        { id: "recent", monitor_id: "m1", checked_at: "2026-07-20T00:00:00.000Z" },
      ],
    });

    await runUptimeChecks({ database: fake as never, now: () => now });

    const ids = fake.tables.uptime_checks.map((row) => row.id);
    expect(ids).toEqual(["recent"]);
  });
});
