import { describe, expect, it } from "vitest";

import {
  buildPublicPolls,
  hasInsertedVote,
  optionBelongsToPoll,
  publicErrorMessage,
} from "./public-events";

describe("public event helpers", () => {
  it("accepts an option only when it belongs to the requested poll", () => {
    expect(optionBelongsToPoll([{ id: "option-1", poll_id: "poll-1" }], "poll-1", "option-1")).toBe(true);
    expect(optionBelongsToPoll([{ id: "option-1", poll_id: "poll-2" }], "poll-1", "option-1")).toBe(false);
    expect(optionBelongsToPoll([], "poll-1", "option-1")).toBe(false);
  });

  it("treats an empty vote insert result as not inserted", () => {
    expect(hasInsertedVote([{ id: "vote-1" }])).toBe(true);
    expect(hasInsertedVote([])).toBe(false);
    expect(hasInsertedVote(null)).toBe(false);
  });

  it("builds poll payloads from scoped options and vote counts", () => {
    const polls = [
      {
        id: "poll-1",
        question: "Choose a time",
        question_hi: null,
        poll_type: "scheduling",
        is_finalized: false,
        winner_option_id: null,
      },
    ];

    const options = [
      { id: "option-1", poll_id: "poll-1", label: "Morning", scheduled_at: null },
      { id: "option-other", poll_id: "poll-other", label: "Other", scheduled_at: null },
    ];

    const voteCounts = [
      { option_id: "option-1", total: 3 },
      { option_id: "option-other", total: 99 },
    ];

    expect(buildPublicPolls(polls, options, voteCounts)).toEqual([
      {
        id: "poll-1",
        question: "Choose a time",
        questionHi: "Choose a time",
        type: "scheduling",
        isFinalized: false,
        winnerOptionId: undefined,
        options: [{ id: "option-1", label: "Morning", votes: 3, scheduledAtIso: null }],
      },
    ]);
  });

  it("does not expose raw database errors publicly", () => {
    expect(publicErrorMessage(new Error('relation "event_poll_votes" does not exist'), "Vote failed.")).toBe("Vote failed.");
  });
});
