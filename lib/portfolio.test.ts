import { describe, expect, it } from "vitest";
import { PROJECTS, getProjects, selectProjects } from "@/data/portfolio";

describe("selectProjects", () => {
  it("picks projects by id, in the given order, skipping unknown ids", () => {
    const [first, second] = PROJECTS;
    expect(selectProjects({ ids: [second.id, "not-a-project", first.id] })).toEqual([second, first]);
  });

  it("picks a group, and everything for 'all' or no input", () => {
    expect(selectProjects({ group: "earlier" })).toEqual(getProjects("earlier"));
    expect(selectProjects({ group: "wip" })).toEqual(getProjects("wip"));
    expect(selectProjects({ group: "all" })).toEqual(PROJECTS);
    expect(selectProjects({ ids: [] })).toEqual(PROJECTS);
  });

  it("marks personal apps as works in progress and never uses shipped language", () => {
    const personal = PROJECTS.filter((project) => project.group !== "earlier");
    expect(personal.length).toBeGreaterThan(0);
    for (const project of personal) {
      expect(project.status).toBe("Work in progress");
      expect(project.oneLiner.toLowerCase()).not.toMatch(/\bshipped\b|\bin production\b|\blaunched\b/);
    }
  });
});
