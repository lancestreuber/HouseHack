import { describe, expect, test } from "bun:test";

import { systemPrompt } from "./prompt";

describe("systemPrompt", () => {
  test("adds the user's onboarding note, marked as not a fact", () => {
    const prompt = systemPrompt([], undefined, false, 'They are a developer. In their words: "Scouting Hazelwood."');
    expect(prompt).toContain("Scouting Hazelwood.");
    expect(prompt).toContain("never cite it");
  });

  test("leaves the section out when there's no note", () => {
    expect(systemPrompt([])).not.toContain("About this person");
  });
});
