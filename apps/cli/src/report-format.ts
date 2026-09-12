import type { ActivityReport, TicketEvent } from "@forge/core";

export function formatEventText(event: TicketEvent): string {
  if (event.eventType === "moved") {
    return `moved ${event.fromColumn ?? "?"} -> ${event.toColumn ?? "?"}`;
  }
  return event.eventType;
}

export function formatReportText(report: ActivityReport): string {
  if (report.tickets.length === 0) {
    return `No activity from ${report.from} to ${report.to}.`;
  }
  const lines: string[] = [`Window: ${report.from} -> ${report.to} (${report.days} day(s))`];
  for (const entry of report.tickets) {
    const projectName = entry.project?.name ?? "(unknown project)";
    lines.push("", `${projectName} - ${entry.ticket.title} [${entry.ticket.column}]`);
    for (const event of entry.events) {
      lines.push(`  - ${event.occurredAt} ${formatEventText(event)}`);
    }
    for (const comment of entry.comments) {
      lines.push(`  - ${comment.createdAt} [${comment.author}] ${comment.body}`);
    }
  }
  return lines.join("\n");
}

export function formatReportJson(report: ActivityReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function writeReportOutput(report: ActivityReport, json: boolean): void {
  process.stdout.write(json ? formatReportJson(report) : `${formatReportText(report)}\n`);
}
