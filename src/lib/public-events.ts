export type PublicPollRow = {
  id: string;
  question: string;
  question_hi: string | null;
  poll_type: string;
  is_finalized: boolean;
  winner_option_id: string | null;
};

export type PublicPollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  scheduled_at: string | null;
};

export type PublicPollVoteCountRow = {
  option_id: string;
  total: number | string;
};

export type PollOptionIdentityRow = {
  id: string;
  poll_id: string;
};

export function optionBelongsToPoll(rows: PollOptionIdentityRow[], pollId: string, optionId: string) {
  return rows.some((row) => row.id === optionId && row.poll_id === pollId);
}

export function hasInsertedVote(rows: unknown) {
  return Array.isArray(rows) && Boolean(rows[0]);
}

export function publicErrorMessage(_error: unknown, fallback: string) {
  return fallback;
}

export function buildPublicPolls(
  polls: PublicPollRow[],
  options: PublicPollOptionRow[],
  voteCounts: PublicPollVoteCountRow[],
) {
  const voteCountByOptionId = new Map(
    voteCounts.map((row) => [row.option_id, Number(row.total) || 0]),
  );

  return polls.map((poll) => ({
    id: poll.id,
    question: poll.question,
    questionHi: poll.question_hi ?? poll.question,
    type: poll.poll_type,
    options: options
      .filter((option) => option.poll_id === poll.id)
      .map((option) => ({
        id: option.id,
        label: option.label,
        votes: voteCountByOptionId.get(option.id) ?? 0,
        scheduledAtIso: option.scheduled_at,
      })),
    isFinalized: poll.is_finalized,
    winnerOptionId: poll.winner_option_id ?? undefined,
  }));
}
