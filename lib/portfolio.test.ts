import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/data/portfolio";

describe("PROJECTS", () => {
  it("lists only confirmed company work", () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
    for (const project of PROJECTS) {
      expect(project.confirmed).toBe(true);
      expect(project.company).toBeTruthy();
    }
  });

  it("has unique ids", () => {
    const ids = PROJECTS.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
