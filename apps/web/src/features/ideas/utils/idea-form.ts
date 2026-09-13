export function linksFromString(linksString: string): string[] {
  const links = linksString
    .split(/[,\n]/)
    .map((link) => link.trim())
    .filter((link) => link.length > 0);

  return Array.from(new Set(links));
}
