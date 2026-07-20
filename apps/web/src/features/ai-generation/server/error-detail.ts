import "server-only";

const SECRET_PATTERN = /(api[_-]?key|authorization|bearer|gsk_|sk-)[^\s"']*/gi;

export function sanitizeErrorDetail(error: unknown): string {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.name);
    if (error.message.trim()) parts.push(error.message.trim());
  } else if (typeof error === "string" && error.trim()) {
    parts.push(error.trim());
  } else {
    parts.push("unknown error");
  }

  if (typeof error === "object" && error !== null) {
    const record = error as {
      status?: unknown;
      code?: unknown;
      cause?: unknown;
      error?: unknown;
    };
    if (typeof record.status === "number") parts.push(`status=${record.status}`);
    if (typeof record.code === "string" && record.code.trim()) {
      parts.push(`code=${record.code.trim()}`);
    }
    if (record.error && typeof record.error === "object") {
      const body = record.error as { message?: unknown; type?: unknown };
      if (typeof body.type === "string" && body.type.trim()) parts.push(`type=${body.type.trim()}`);
      if (typeof body.message === "string" && body.message.trim()) parts.push(body.message.trim());
    }
    if (record.cause instanceof Error && record.cause.message.trim()) {
      parts.push(`cause=${record.cause.message.trim()}`);
    }
  }

  return parts.join(" | ").replace(SECRET_PATTERN, "[redacted]").slice(0, 500);
}
