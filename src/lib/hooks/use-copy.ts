import { useCallback, useState } from "react"

export function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    },
    [timeout]
  )

  return { copied, copy }
}
