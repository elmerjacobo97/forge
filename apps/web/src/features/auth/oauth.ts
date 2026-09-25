export function safeRedirectPath(value: string | undefined): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    /[\\\u0000-\u001f]/.test(value)
  ) {
    return "/dev-board";
  }

  return value;
}
