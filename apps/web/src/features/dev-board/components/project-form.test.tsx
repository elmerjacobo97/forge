// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../types/project";
import { ProjectForm } from "./project-form";

const onSubmit = vi.fn();
const onOpenChange = vi.fn();

const project: Project = {
  id: "project-1",
  name: "Forge",
  description: "Dev tools",
  status: "completed",
  createdAt: "2026-09-23T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

function submitForm() {
  fireEvent.submit(document.getElementById("project-form")!);
}

describe("ProjectForm status", () => {
  it("creates projects as planned by default", async () => {
    render(
      <ProjectForm
        open
        onOpenChange={onOpenChange}
        editProject={null}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New project" } });
    submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "New project",
        description: "",
        status: "planned",
      });
    });
  });

  it("keeps the existing status when editing a project", async () => {
    render(
      <ProjectForm
        open
        onOpenChange={onOpenChange}
        editProject={project}
        onSubmit={onSubmit}
      />,
    );
    submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Forge",
        description: "Dev tools",
        status: "completed",
      });
    });
  });

  it("submits a newly selected status", async () => {
    render(
      <ProjectForm
        open
        onOpenChange={onOpenChange}
        editProject={project}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Status" }));
    fireEvent.click(await screen.findByRole("option", { name: "Paused" }));
    submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Forge",
        description: "Dev tools",
        status: "paused",
      });
    });
  });
});
