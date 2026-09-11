import { describe, expect, it } from "vitest";

import {
  EMPTY_TASK_BOARD_STATE,
  hasActiveFilters,
  parseTaskBoardState,
  serialiseTaskBoardState,
  taskQueryFilters,
} from "./taskboard-url-state";

describe("parsing task board state from a URL", () => {
  it("defaults to the board view with nothing selected", () => {
    expect(parseTaskBoardState(new URLSearchParams())).toEqual(EMPTY_TASK_BOARD_STATE);
  });

  it("reads an exact reminder deep link", () => {
    const state = parseTaskBoardState(new URLSearchParams("projectId=p1&taskId=t9"));
    expect(state.projectId).toBe("p1");
    expect(state.taskId).toBe("t9");
  });

  it("reads the my-tasks view", () => {
    expect(parseTaskBoardState(new URLSearchParams("view=mine")).view).toBe("mine");
  });

  it("falls back to the board for an unknown view", () => {
    expect(parseTaskBoardState(new URLSearchParams("view=nonsense")).view).toBe("board");
  });

  it("keeps filters", () => {
    const state = parseTaskBoardState(new URLSearchParams("status=blocked&priority=high&q=agenda"));
    expect(state).toMatchObject({ status: "blocked", priority: "high", search: "agenda" });
  });

  it("discards filter values outside the known sets", () => {
    const state = parseTaskBoardState(new URLSearchParams("status=deleted&priority=critical"));
    expect(state.status).toBeNull();
    expect(state.priority).toBeNull();
  });

  it("treats blank parameters as absent", () => {
    const state = parseTaskBoardState(new URLSearchParams("projectId=&q=%20%20"));
    expect(state.projectId).toBeNull();
    expect(state.search).toBe("");
  });

  it("accepts a plain object, as server components supply", () => {
    expect(parseTaskBoardState({ projectId: "p1", view: "mine" })).toMatchObject({
      projectId: "p1",
      view: "mine",
    });
  });
});

describe("round-tripping", () => {
  it("survives serialise → parse unchanged", () => {
    const state = {
      view: "mine" as const,
      projectId: "p1",
      taskId: "t2",
      status: "in_progress",
      priority: "urgent",
      search: "venue booking",
    };
    expect(parseTaskBoardState(new URLSearchParams(serialiseTaskBoardState(state)))).toEqual(state);
  });

  it("writes nothing for the default state, keeping plain links clean", () => {
    expect(serialiseTaskBoardState(EMPTY_TASK_BOARD_STATE)).toBe("");
  });

  it("preserves a Hindi search term", () => {
    const state = { ...EMPTY_TASK_BOARD_STATE, search: "कार्यक्रम" };
    const parsed = parseTaskBoardState(new URLSearchParams(serialiseTaskBoardState(state)));
    expect(parsed.search).toBe("कार्यक्रम");
  });
});

describe("derived query filters", () => {
  it("sends only the filters that are set", () => {
    expect(taskQueryFilters(EMPTY_TASK_BOARD_STATE)).toEqual({ limit: "100" });
  });

  it("passes through status, priority and search", () => {
    expect(
      taskQueryFilters({
        ...EMPTY_TASK_BOARD_STATE,
        status: "todo",
        priority: "low",
        search: " agenda ",
      }),
    ).toEqual({ limit: "100", status: "todo", priority: "low", search: "agenda" });
  });

  it("reports whether any filter is active", () => {
    expect(hasActiveFilters(EMPTY_TASK_BOARD_STATE)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_TASK_BOARD_STATE, status: "done" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_TASK_BOARD_STATE, search: "  " })).toBe(false);
  });
});
