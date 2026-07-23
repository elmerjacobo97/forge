import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({
  createInsForgeServerClient,
}));

import { uptimeMonitorService } from "./uptime-monitor-service";

const userId = "550e8400-e29b-41d4-a716-446655440000";
const monitorId = "550e8400-e29b-41d4-a716-446655440001";
const monitorIdB = "550e8400-e29b-41d4-a716-446655440099";

const monitorRow = {
  id: monitorId,
  user_id: userId,
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
  created_at: "2026-07-20T00:00:00.000Z",
  request_headers: [{ name: "Authorization", value: "Bearer persisted-secret" }],
};

const createInput = {
  name: "My API",
  url: "https://example.com/health",
  method: "GET" as const,
  expectedStatus: 200,
  intervalMinutes: 5 as const,
  failureThreshold: 2,
  requestHeaders: [{ name: "Authorization", value: "Bearer persisted-secret" }],
};

describe("uptimeMonitorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an authenticated user", async () => {
    await expect(uptimeMonitorService.listMonitors()).rejects.toThrow("Sign in");
  });

  it("rejects a non http(s) URL", async () => {
    await expect(
      uptimeMonitorService.createMonitor({ ...createInput, url: "ftp://example.com" }, userId),
    ).rejects.toThrow();
  });

  it("rejects a URL pointing at a private host (SSRF guard)", async () => {
    await expect(
      uptimeMonitorService.createMonitor({ ...createInput, url: "http://127.0.0.1:8080" }, userId),
    ).rejects.toThrow();
  });

  it("maps monitor rows from InsForge", async () => {
    const order = vi.fn().mockResolvedValue({ data: [monitorRow], error: null });
    database.from.mockReturnValue({
      select: vi.fn(() => ({ order })),
    });

    const result = await uptimeMonitorService.listMonitors(userId);

    expect(result).toEqual([
      {
        id: monitorId,
        userId,
        name: "My API",
        url: "https://example.com/health",
        method: "GET",
        expectedStatus: 200,
        intervalMinutes: 5,
        failureThreshold: 2,
        enabled: true,
        status: "pending",
        consecutiveFailures: 0,
        lastCheckedAt: null,
        createdAt: monitorRow.created_at,
        requestHeaders: [{ name: "Authorization", configured: true }],
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("Bearer persisted-secret");
  });

  it("rejects create when the user already has 10 monitors", async () => {
    database.from.mockReturnValue({
      select: vi.fn(() => ({
        // count-only query has no further chained filters
      })),
    });
    database.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ count: 10, error: null }),
    });

    await expect(uptimeMonitorService.createMonitor(createInput, userId)).rejects.toThrow(
      /at most 10 monitors/i,
    );
  });

  it("creates a monitor when under the cap", async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: monitorRow, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));

    database.from
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 3, error: null }),
      })
      .mockReturnValueOnce({ insert });

    const result = await uptimeMonitorService.createMonitor(createInput, userId);

    expect(result).toMatchObject({
      id: monitorId,
      name: "My API",
    });
    expect(JSON.stringify(result)).not.toContain("Bearer persisted-secret");

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: userId,
        name: "My API",
        request_headers: [{ name: "Authorization", value: "Bearer persisted-secret" }],
      }),
    ]);
  });

  it("rejects null header values when creating a monitor", async () => {
    await expect(
      uptimeMonitorService.createMonitor(
        { ...createInput, requestHeaders: [{ name: "Authorization", value: null }] },
        userId,
      ),
    ).rejects.toThrow("require a value");
    expect(database.from).not.toHaveBeenCalled();
  });

  it("preserves, replaces, adds, and deletes headers during update", async () => {
    const existingHeaders = [
      { name: "Authorization", value: "Bearer preserved-secret" },
      { name: "X-Replace", value: "old-secret" },
      { name: "X-Delete", value: "deleted-secret" },
    ];
    const resolvedHeaders = [
      existingHeaders[0],
      { name: "X-Replace", value: "new-secret" },
      { name: "X-New", value: "added-secret" },
    ];
    const existingSingle = vi
      .fn()
      .mockResolvedValue({ data: { request_headers: existingHeaders }, error: null });
    const existingEq = vi.fn(() => ({ single: existingSingle }));
    const updateSingle = vi.fn().mockResolvedValue({
      data: { ...monitorRow, request_headers: resolvedHeaders },
      error: null,
    });
    const updateSelect = vi.fn(() => ({ single: updateSingle }));
    const updateEq = vi.fn(() => ({ select: updateSelect }));
    const update = vi.fn(() => ({ eq: updateEq }));

    database.from
      .mockReturnValueOnce({ select: vi.fn(() => ({ eq: existingEq })) })
      .mockReturnValueOnce({ update });

    const result = await uptimeMonitorService.updateMonitor(
      monitorId,
      {
        ...createInput,
        requestHeaders: [
          { name: "authorization", value: null },
          { name: "X-Replace", value: "new-secret" },
          { name: "X-New", value: "added-secret" },
        ],
      },
      userId,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ request_headers: resolvedHeaders }),
    );
    expect(result.requestHeaders).toEqual([
      { name: "Authorization", configured: true },
      { name: "X-Replace", configured: true },
      { name: "X-New", configured: true },
    ]);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("rejects preserving a header without a persisted match", async () => {
    const existingSingle = vi.fn().mockResolvedValue({
      data: { request_headers: monitorRow.request_headers },
      error: null,
    });
    const existingEq = vi.fn(() => ({ single: existingSingle }));
    database.from.mockReturnValueOnce({ select: vi.fn(() => ({ eq: existingEq })) });

    await expect(
      uptimeMonitorService.updateMonitor(
        monitorId,
        { ...createInput, requestHeaders: [{ name: "X-Unknown", value: null }] },
        userId,
      ),
    ).rejects.toThrow('Cannot preserve unconfigured header "X-Unknown"');
    expect(database.from).toHaveBeenCalledTimes(1);
  });

  it("deletes a monitor by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    database.from.mockReturnValue({
      delete: vi.fn(() => ({ eq })),
    });

    await expect(uptimeMonitorService.deleteMonitor(monitorId, userId)).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith("id", monitorId);
  });

  it("lists checks for a monitor", async () => {
    const checkRow = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      monitor_id: monitorId,
      ok: true,
      status_code: 200,
      latency_ms: 120,
      error: null,
      checked_at: "2026-07-20T01:00:00.000Z",
    };
    const order = vi.fn().mockResolvedValue({ data: [checkRow], error: null });
    const eq = vi.fn(() => ({ order }));
    database.from.mockReturnValue({
      select: vi.fn(() => ({ eq })),
    });

    await expect(uptimeMonitorService.listChecks(monitorId, userId)).resolves.toEqual([
      {
        id: checkRow.id,
        monitorId,
        ok: true,
        statusCode: 200,
        latencyMs: 120,
        error: null,
        checkedAt: checkRow.checked_at,
      },
    ]);
    expect(eq).toHaveBeenCalledWith("monitor_id", monitorId);
  });

  it("returns null notification settings when none saved yet", async () => {
    const eq = vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
    database.from.mockReturnValue({ select: vi.fn(() => ({ eq })) });

    await expect(uptimeMonitorService.getNotificationSettings(userId)).resolves.toBeNull();
  });

  it("inserts notification settings when none exist yet", async () => {
    const settingsRow = {
      user_id: userId,
      telegram_bot_token: "bot-token",
      telegram_chat_id: "chat-1",
      updated_at: "2026-07-20T02:00:00.000Z",
    };
    const selectExisting = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    };
    const insertSingle = vi.fn().mockResolvedValue({ data: settingsRow, error: null });
    const insertQuery = {
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingle })) })),
    };
    database.from.mockReturnValueOnce(selectExisting).mockReturnValueOnce(insertQuery);

    await expect(
      uptimeMonitorService.saveNotificationSettings(
        { telegramBotToken: "bot-token", telegramChatId: "chat-1" },
        userId,
      ),
    ).resolves.toEqual({
      userId,
      telegramBotToken: "bot-token",
      telegramChatId: "chat-1",
      updatedAt: settingsRow.updated_at,
    });
  });

  it("maps latency bucket rows from RPC (coerces numeric strings)", async () => {
    database.rpc.mockResolvedValue({
      data: [
        {
          bucket_start: "2026-07-22T10:00:00.000Z",
          avg_latency_ms: "142.5",
          ok_count: "9",
          total_count: "10",
        },
      ],
      error: null,
    });

    await expect(uptimeMonitorService.getLatencyBuckets(monitorId, "24h", userId)).resolves.toEqual(
      [
        {
          bucketStart: "2026-07-22T10:00:00.000Z",
          avgLatencyMs: 142.5,
          okCount: 9,
          totalCount: 10,
        },
      ],
    );
    expect(database.rpc).toHaveBeenCalledWith("uptime_latency_buckets", {
      p_monitor_id: monitorId,
      p_range: "24h",
    });
  });

  it("rejects an invalid latency range", async () => {
    await expect(
      uptimeMonitorService.getLatencyBuckets(monitorId, "1h" as "24h", userId),
    ).rejects.toThrow();
    expect(database.rpc).not.toHaveBeenCalled();
  });

  it("maps daily uptime rows and computes percentage", async () => {
    database.rpc.mockResolvedValue({
      data: [
        { day: "2026-07-21", ok_count: 95, total_count: 100 },
        { day: "2026-07-22T00:00:00.000Z", ok_count: 0, total_count: 12 },
      ],
      error: null,
    });

    await expect(uptimeMonitorService.getDailyUptime(monitorId, userId)).resolves.toEqual([
      {
        date: "2026-07-21",
        uptimePercentage: 95,
        okCount: 95,
        totalCount: 100,
      },
      {
        date: "2026-07-22",
        uptimePercentage: 0,
        okCount: 0,
        totalCount: 12,
      },
    ]);
    expect(database.rpc).toHaveBeenCalledWith("uptime_daily_uptime", {
      p_monitor_id: monitorId,
    });
  });

  it("groups sparkline rows by monitor and fills empty monitors", async () => {
    database.rpc.mockResolvedValue({
      data: [
        {
          monitor_id: monitorId,
          bucket_start: "2026-07-22T10:00:00.000Z",
          avg_latency_ms: 80,
          ok_count: 2,
          total_count: 2,
        },
      ],
      error: null,
    });

    await expect(
      uptimeMonitorService.getSparklines([monitorId, monitorIdB], userId),
    ).resolves.toEqual([
      {
        monitorId,
        buckets: [
          {
            bucketStart: "2026-07-22T10:00:00.000Z",
            avgLatencyMs: 80,
            okCount: 2,
            totalCount: 2,
          },
        ],
      },
      { monitorId: monitorIdB, buckets: [] },
    ]);
    expect(database.rpc).toHaveBeenCalledWith("uptime_sparklines", {
      p_monitor_ids: [monitorId, monitorIdB],
    });
  });

  it("returns empty sparklines without calling RPC when no monitor ids", async () => {
    await expect(uptimeMonitorService.getSparklines([], userId)).resolves.toEqual([]);
    expect(database.rpc).not.toHaveBeenCalled();
  });

  it("computes uptime stats from latency bucket aggregations", async () => {
    database.rpc
      .mockResolvedValueOnce({
        data: [
          {
            bucket_start: "2026-07-22T10:00:00.000Z",
            avg_latency_ms: 100,
            ok_count: 9,
            total_count: 10,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            bucket_start: "2026-07-20T00:00:00.000Z",
            avg_latency_ms: 110,
            ok_count: 48,
            total_count: 50,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    await expect(uptimeMonitorService.getUptimeStats(monitorId, userId)).resolves.toEqual({
      monitorId,
      uptime24h: 90,
      uptime7d: 96,
      uptime30d: null,
    });
  });
});
