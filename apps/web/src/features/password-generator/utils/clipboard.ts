export const CLIPBOARD_UNAVAILABLE_ERROR =
  "Copying is unavailable because this browser does not support the Clipboard API.";

export async function copyPassword(text: string): Promise<void> {
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;

  if (typeof clipboard?.writeText !== "function") {
    throw new Error(CLIPBOARD_UNAVAILABLE_ERROR);
  }

  await clipboard.writeText(text);
}
