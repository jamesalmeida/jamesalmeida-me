import { describe, expect, it } from "vitest";
import { PROJECTS, getProjects, selectProjects } from "@/data/portfolio";

describe("selectProjects", () => {
  it("picks projects by id, in the given order, skipping unknown ids", () => {
    const [first, second] = PROJECTS;
    expect(selectProjects({ ids: [second.id, "not-a-project", first.id] })).toEqual([second, first]);
  });

  it("picks a group, and everything for 'all' or no input", () => {
    expect(selectProjects({ group: "earlier" })).toEqual(getProjects("earlier"));
    expect(selectProjects({ group: "all" })).toEqual(PROJECTS);
    expect(selectProjects({ ids: [] })).toEqual(PROJECTS);
  });
});
