export const FLOW_STEP_KINDS = [
  "page",
  "ui",
  "action",
  "service",
  "db",
  "command",
  "tool",
] as const;

export type FlowStepKind = (typeof FLOW_STEP_KINDS)[number];

export interface ProjectFlowStep {
  kind: FlowStepKind;
  label: string;
  symbol?: string;
  file?: string;
  line?: number;
  input?: string;
  output?: string;
  inferred: boolean;
}

export interface ProjectModule {
  slug: string;
  name: string;
  description: string;
  dependsOn: string[];
}

export interface ProjectFlowSummary {
  slug: string;
  moduleSlug: string;
  title: string;
  summary: string;
  stepCount: number;
}

export interface ProjectFlow extends Omit<ProjectFlowSummary, "stepCount"> {
  steps: ProjectFlowStep[];
  commit: string | null;
}

export interface ProjectMap {
  modules: ProjectModule[];
  flows: ProjectFlowSummary[];
}
