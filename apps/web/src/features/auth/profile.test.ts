import { describe, expect, it } from "vitest";

import { profileAvatarUrl } from "./profile";

describe("profileAvatarUrl", () => {
  it("keeps http and https avatar URLs and drops anything else", () => {
    expect(profileAvatarUrl({ avatar_url: "https://avatars.githubusercontent.com/u/1" })).toBe(
      "https://avatars.githubusercontent.com/u/1",
    );
    expect(profileAvatarUrl({ avatar_url: "http://example.com/a.png" })).toBe(
      "http://example.com/a.png",
    );
    expect(profileAvatarUrl(null)).toBeNull();
    expect(profileAvatarUrl({})).toBeNull();
    expect(profileAvatarUrl({ avatar_url: "" })).toBeNull();
    expect(profileAvatarUrl({ avatar_url: "not-a-url" })).toBeNull();
    expect(profileAvatarUrl({ avatar_url: "javascript:alert(1)" })).toBeNull();
  });
});
