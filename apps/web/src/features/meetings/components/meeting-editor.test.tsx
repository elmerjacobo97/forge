// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("../actions", () => ({
  createMeetingAction: mocks.createMeeting,
  updateMeetingAction: mocks.updateMeeting,
  deleteMeetingAction: mocks.deleteMeeting,
}));
import { MeetingEditor } from "./meeting-editor";

const meetingAt = "2026-09-26T10:00:00.000Z";

beforeEach(() => vi.clearAllMocks());

describe("MeetingEditor", () => {
  it("saves all meeting sections and returns to the history", async () => {
    mocks.createMeeting.mockResolvedValue({
      ok: true,
      data: { id: "meeting-1", title: "Planning" },
    });
    render(
      <MeetingEditor
        initialMeeting={null}
        projects={[]}
        initialMeetingAt={meetingAt}
      />,
    );

    fireEvent.change(screen.getByLabelText("Meeting title"), {
      target: { value: "Planning" },
    });
    fireEvent.change(screen.getByLabelText("Attendees · optional"), {
      target: { value: "Alex\nSam" },
    });
    fireEvent.change(screen.getByLabelText("Decisions · one per line"), {
      target: { value: "Ship the first slice\nReview next week" },
    });
    fireEvent.change(screen.getByLabelText("Context and notes"), {
      target: { value: "Release planning" },
    });

    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() => expect(mocks.createMeeting).toHaveBeenCalledOnce());
    expect(mocks.createMeeting).toHaveBeenCalledWith({
      projectId: null,
      title: "Planning",
      meetingAt: new Date(meetingAt).toISOString(),
      attendees: ["Alex", "Sam"],
      context: "Release planning",
      decisions: ["Ship the first slice", "Review next week"],
    });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/meetings"));
  });

  it("updates an existing meeting from its own initial values", async () => {
    const existingMeeting = {
      id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
      projectId: null,
      title: "Planning",
      meetingAt,
      attendees: ["Alex"],
      context: "Release planning",
      decisions: ["Ship the first slice"],
      createdAt: meetingAt,
      updatedAt: meetingAt,
    };
    mocks.updateMeeting.mockResolvedValue({
      ok: true,
      data: { id: existingMeeting.id, title: "Updated planning" },
    });
    render(
      <MeetingEditor
        initialMeeting={existingMeeting}
        projects={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Meeting title"), {
      target: { value: "Updated planning" },
    });
    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() => expect(mocks.updateMeeting).toHaveBeenCalledOnce());
    expect(mocks.updateMeeting).toHaveBeenCalledWith(
      existingMeeting.id,
      expect.objectContaining({
        title: "Updated planning",
        meetingAt: new Date(meetingAt).toISOString(),
      }),
    );
    expect(mocks.createMeeting).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(`/meetings/${existingMeeting.id}`),
    );
  });

  it("deletes the meeting from the editor and returns to the history", async () => {
    const existingMeeting = {
      id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
      projectId: null,
      title: "Planning",
      meetingAt,
      attendees: [],
      context: "",
      decisions: [],
      createdAt: meetingAt,
      updatedAt: meetingAt,
    };
    mocks.deleteMeeting.mockResolvedValue({ ok: true, data: undefined });
    render(
      <MeetingEditor
        initialMeeting={existingMeeting}
        projects={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete meeting" }));

    await waitFor(() => expect(mocks.deleteMeeting).toHaveBeenCalledWith(existingMeeting.id));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/meetings"));
  });

  it("returns to the originating project after creating from its board", async () => {
    mocks.createMeeting.mockResolvedValue({
      ok: true,
      data: { id: "meeting-2", title: "Planning" },
    });
    render(
      <MeetingEditor
        initialMeeting={null}
        projects={[]}
        initialProjectId="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        returnToProjectId="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        initialMeetingAt={meetingAt}
      />,
    );

    fireEvent.change(screen.getByLabelText("Meeting title"), { target: { value: "Planning" } });
    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/dev-board/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
    );
  });

  it("resets editor state when switching from an existing meeting to a new one", async () => {
    const existingMeeting = {
      id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
      projectId: null,
      title: "Previous planning",
      meetingAt,
      attendees: ["Alex"],
      context: "Old context",
      decisions: ["Old decision"],
      createdAt: meetingAt,
      updatedAt: meetingAt,
    };
    mocks.createMeeting.mockResolvedValue({ ok: true, data: { id: "meeting-3" } });
    const { rerender } = render(
      <MeetingEditor
        key={existingMeeting.id}
        initialMeeting={existingMeeting}
        projects={[]}
      />,
    );

    rerender(
      <MeetingEditor
        key="new"
        initialMeeting={null}
        projects={[]}
        initialMeetingAt={meetingAt}
      />,
    );
    expect((screen.getByLabelText("Meeting title") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Context and notes") as HTMLTextAreaElement).value).toBe("");

    fireEvent.change(screen.getByLabelText("Meeting title"), {
      target: { value: "Fresh planning" },
    });
    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() => expect(mocks.createMeeting).toHaveBeenCalledOnce());
    expect(mocks.updateMeeting).not.toHaveBeenCalled();
  });

  it("clears a global draft when the new editor is reused for a project", async () => {
    const project = {
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      name: "Forge",
      description: "",
      status: "planned" as const,
      createdAt: meetingAt,
    };
    mocks.createMeeting.mockResolvedValue({ ok: true, data: { id: "meeting-project" } });
    const { rerender } = render(
      <MeetingEditor
        key="new"
        initialMeeting={null}
        projects={[project]}
        initialMeetingAt={meetingAt}
      />,
    );
    fireEvent.change(screen.getByLabelText("Meeting title"), {
      target: { value: "Weekly planning" },
    });
    fireEvent.change(screen.getByLabelText("Context and notes"), {
      target: { value: "Previous global draft" },
    });

    rerender(
      <MeetingEditor
        key="new"
        initialMeeting={null}
        projects={[project]}
        initialProjectId="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        returnToProjectId="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
        initialMeetingAt={meetingAt}
      />,
    );

    expect((screen.getByLabelText("Meeting title") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Context and notes") as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByRole("combobox").textContent).toContain("Forge");

    fireEvent.change(screen.getByLabelText("Meeting title"), {
      target: { value: "Project planning" },
    });
    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() =>
      expect(mocks.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          title: "Project planning",
        }),
      ),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/dev-board/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
  });

  it("requires a title before making a server action call", async () => {
    render(
      <MeetingEditor
        initialMeeting={null}
        projects={[]}
        initialMeetingAt={meetingAt}
      />,
    );

    fireEvent.submit(document.getElementById("meeting-form")!);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Title is required."),
    );
    expect(mocks.createMeeting).not.toHaveBeenCalled();
  });
});
