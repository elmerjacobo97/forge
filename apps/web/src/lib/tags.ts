export function tagsFromString(tagsString: string): string[] {
  return tagsString.split(",").flatMap((tag) => {
    const trimmed = tag.trim().toLowerCase();
    return trimmed ? [trimmed] : [];
  });
}
