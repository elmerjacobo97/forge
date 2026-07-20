"use client";

import { useEffect, useState } from "react";

/** True when the document is visible (for pause-friendly polling). */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState === "visible",
  );

  useEffect(() => {
    function onVisibilityChange() {
      setVisible(document.visibilityState === "visible");
    }
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return visible;
}
