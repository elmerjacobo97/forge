export function escapeLikePattern(value: string): string {
  return value.replace(/([\\%_])/g, "\\$1");
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/([\\"])/g, "\\$1")}"`;
}
