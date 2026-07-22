import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const runUptimeChecks = vi.hoisted(() => vi.fn());
vi.mock("./run-checks", () => ({ runUptimeChecks }));

import type { RunChecksHandlerDeps } from "./run-checks-handler";
import { handleUptimeRunRequest } from "./run-checks-handler";

const originalCronToken = process.env.CRON_TOKEN;

describe("handleUptimeRunRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_TOKEN = "secret-token";
  });

  afterEach(() => {
    process.env.CRON_TOKEN = originalCronToken;
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const request = new Request("http://localhost/api/uptime/run", { method: "POST" });

    const response = await handleUptimeRunRequest(request);

    expect(response.status).toBe(401);
    expect(runUptimeChecks).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token does not match CRON_TOKEN", async () => {
    const request = new Request("http://localhost/api/uptime/run", {
      method: "POST",
      headers: { authorization: "Bearer wrong-token" },
    });

    const response = await handleUptimeRunRequest(request);

    expect(response.status).toBe(401);
    expect(runUptimeChecks).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_TOKEN is not configured", async () => {
    delete process.env.CRON_TOKEN;
    const request = new Request("http://localhost/api/uptime/run", {
      method: "POST",
      headers: { authorization: "Bearer anything" },
    });

    const response = await handleUptimeRunRequest(request);

    expect(response.status).toBe(401);
  });

  it("runs the checks and returns the summary with a valid token", async () => {
    runUptimeChecks.mockResolvedValue({ checked: 3 });
    const database = { from: vi.fn() };
    const createAdminClient = vi.fn(() => ({ database })) as unknown as NonNullable<
      RunChecksHandlerDeps["createAdminClient"]
    >;
    const request = new Request("http://localhost/api/uptime/run", {
      method: "POST",
      headers: { authorization: "Bearer secret-token" },
    });

    const response = await handleUptimeRunRequest(request, { createAdminClient });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ checked: 3 });
    expect(runUptimeChecks).toHaveBeenCalledWith({ database });
  });

  it("returns 503 when the admin client is misconfigured", async () => {
    const createAdminClient = vi.fn(() => {
      throw new Error("INSFORGE_API_KEY is not configured");
    });
    const request = new Request("http://localhost/api/uptime/run", {
      method: "POST",
      headers: { authorization: "Bearer secret-token" },
    });

    const response = await handleUptimeRunRequest(request, { createAdminClient });

    expect(response.status).toBe(503);
    expect(runUptimeChecks).not.toHaveBeenCalled();
  });
});
