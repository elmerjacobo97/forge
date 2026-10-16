import { describe, expect, it } from "vitest";
import { parseNoteCreateInput, parseNoteUpdateInput } from "../../src/note-schema.js";

const projectId = "92acfbba-6bc4-456a-96eb-965ce5b090fd";

describe("parseNoteCreateInput", () => {
  it("applies the empty tags default", () => {
    expect(
      parseNoteCreateInput({ title: "Expo SDK 52", content: "Use `expo-router` v4." }),
    ).toEqual({ title: "Expo SDK 52", content: "Use `expo-router` v4.", tags: [] });
  });

  it("normalizes tags and accepts a project id", () => {
    expect(
      parseNoteCreateInput({
        title: "Expo SDK 52",
        content: "Body",
        tags: [" RN-0.76 ", "rn-0.76", "", "Expo"],
        projectId,
      }),
    ).toEqual({ title: "Expo SDK 52", content: "Body", tags: ["rn-0.76", "expo"], projectId });
  });

  it("rejects short title, empty content and non-uuid project id", () => {
    expect(parseNoteCreateInput({ title: "x", content: "Body" })).toEqual({
      error: "Title must be at least 2 characters.",
    });
    expect(parseNoteCreateInput({ title: "Valid", content: "" })).toEqual({
      error: "Content is required.",
    });
    expect(parseNoteCreateInput({ title: "Valid", content: "Body", projectId: "nope" })).toEqual({
      error: "Project id must be a valid UUID.",
    });
  });
});

describe("parseNoteUpdateInput", () => {
  it("accepts null projectId to unlink", () => {
    expect(parseNoteUpdateInput({ projectId: null })).toEqual({ projectId: null });
  });

  it("rejects an update without fields", () => {
    expect(parseNoteUpdateInput({})).toEqual({ error: "Provide at least one field to update." });
  });
});
