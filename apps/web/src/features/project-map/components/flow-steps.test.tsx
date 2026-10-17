import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { ProjectFlowStep } from "../types";
import { FlowSteps } from "./flow-steps";

const steps: ProjectFlowStep[] = [
  { kind: "ui", label: "Open dialog", inferred: true },
  {
    kind: "service",
    label: "Insert project",
    symbol: "createProject",
    file: "src/projects.ts",
    line: 42,
    input: "name",
    output: "Project",
    inferred: false,
  },
];

describe("FlowSteps", () => {
  it("renders kind badge, file:line, input and output per step", () => {
    const html = renderToStaticMarkup(<FlowSteps steps={steps} />);

    expect(html).toContain(">service<");
    expect(html).toContain("src/projects.ts:42");
    expect(html).toContain("In: name");
    expect(html).toContain("Out: Project");
  });

  it("marks only inferred steps", () => {
    const html = renderToStaticMarkup(<FlowSteps steps={steps} />);

    expect(html.match(/>inferred</g)).toHaveLength(1);
  });
});
