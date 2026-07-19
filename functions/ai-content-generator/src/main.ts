interface RuntimeResponse {
  json(body: unknown, statusCode?: number): unknown;
}

interface RuntimeContext {
  res: RuntimeResponse;
}

export default function ({ res }: RuntimeContext) {
  return res.json({ status: "ready" });
}
