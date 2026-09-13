import { useCallback, useEffect, useRef, useState } from "react";

import { useDebounce } from "./use-debounce";

export function useUrlSearch(query: string, onCommit: (value: string) => void, delay = 200) {
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [lastQuery, setLastQuery] = useState(query);
  const debouncedDraft = useDebounce(draft, delay);
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (draft === null || debouncedDraft !== draft) return;
    if (draft.trim() === query) return;
    if (lastSentRef.current === draft) return;
    lastSentRef.current = draft;
    onCommit(draft);
  }, [draft, debouncedDraft, query, onCommit]);

  if (
    draft !== null &&
    debouncedDraft === draft &&
    draft.trim() !== query &&
    !pending.includes(draft)
  ) {
    setPending([...pending, draft]);
  }

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

  const setValue = useCallback((next: string) => {
    lastSentRef.current = null;
    setDraft(next);
  }, []);

  return { value: draft ?? query, setValue };
}
