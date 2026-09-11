"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PAGE_SIZE, parseVisibleParam } from "@/lib/pagination";

export function ListPagination({ loaded, total }: { loaded: number; total: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (loaded >= total) {
    return null;
  }

  function handleLoadMore() {
    const params = new URLSearchParams(searchParams.toString());
    const visible = parseVisibleParam(params.get("visible") ?? undefined);
    params.set("visible", String(visible + PAGE_SIZE));
    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        Showing {loaded} of {total}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLoadMore}
        disabled={isPending}
        aria-busy={isPending}
      >
        Load more
      </Button>
    </div>
  );
}
