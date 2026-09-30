import { useCallback, useEffect, useRef, useState } from "react";

export function useUrlSearch(query: string, onCommit: (value: string) => void, delay = 200) {
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [lastQuery, setLastQuery] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestRef = useRef({ query, draft, onCommit });

  useEffect(() => {
    latestRef.current = { query, draft, onCommit };
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (query !== lastQuery) {
    setLastQuery(query);

    if (pending.some((value) => value.trim() === query)) {
      setPending(pending.filter((value) => value.trim() !== query));
      if (draft === null || draft.trim() === query) setDraft(null);
    } else if (draft !== null) {
      setPending([]);
      setDraft(null);
    }
  }

  const setValue = useCallback(
    (next: string) => {
      setDraft(next);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const latest = latestRef.current;
        if (latest.draft !== next || next.trim() === latest.query) return;
        setPending((current) => (current.includes(next) ? current : [...current, next]));
        latest.onCommit(next);
      }, delay);
    },
    [delay],
  );

  return { value: draft ?? query, setValue };
}
