/**
 * Pragya Pravah — Critical Status Transitions
 *
 * A critical transition is a status change whose history row, and whose
 * notification, must not be able to come apart from the status change itself.
 *
 * The Neon HTTP driver has no *interactive* transactions (drizzle's
 * `db.transaction()` throws), but it does support non-interactive ones: a
 * single SQL statement is atomic on its own, and `db.batch()` is executed by
 * the driver as one Postgres transaction. So the guarantee here does not rest
 * on compensation — it rests on the writes being one statement:
 *
 *     WITH updated AS (
 *       UPDATE … SET status = $new WHERE id = $id AND status = $expected
 *       RETURNING …
 *     ), history AS (
 *       INSERT INTO …_history SELECT … FROM updated   -- fires only if UPDATE matched
 *     )
 *     SELECT … FROM updated;
 *
 * Two properties follow, and neither needs a rollback path:
 *
 *   1. Compare-and-swap. `status = $expected` in the WHERE clause means that of
 *      two conflicting transitions out of the same prior state exactly one
 *      updates a row; the other returns no rows and is reported stale.
 *   2. All-or-nothing. The history (and notification) INSERTs select FROM the
 *      UPDATE's output, so they cannot fire without it, and a failure anywhere
 *      in the statement aborts the whole thing. There is no window in which a
 *      status change is committed without its history.
 *
 * The previous version of this module updated, then inserted, then tried to
 * undo — which could neither be atomic nor honestly report whether the undo
 * had taken effect. It is gone.
 */

export type CriticalTransitionOutcome<TRow> =
  | { status: "committed"; row: TRow; notificationWritten: boolean }
  | { status: "stale"; expectedFrom: string }
  | { status: "failed"; error: unknown };

export interface AtomicTransitionStatement<TRow> {
  /** Expected current status, present in the statement's WHERE clause. */
  expectedFrom: string;
  /**
   * Runs the single atomic statement. Resolves to the updated row, or to null
   * / undefined when the compare-and-swap matched nothing.
   *
   * MUST be one statement (or a `db.batch()`), never a sequence of awaits.
   */
  run: () => Promise<TRow | null | undefined>;
  /** Whether the statement also wrote the notification row. */
  wroteNotification?: (row: TRow) => boolean;
}

export async function commitCriticalTransition<TRow>(
  statement: AtomicTransitionStatement<TRow>,
): Promise<CriticalTransitionOutcome<TRow>> {
  let row: TRow | null | undefined;

  try {
    row = await statement.run();
  } catch (error) {
    // One statement: a throw means nothing was committed. There is no partial
    // state to describe and nothing to undo.
    return { status: "failed", error };
  }

  if (row === null || row === undefined) {
    return { status: "stale", expectedFrom: statement.expectedFrom };
  }

  return {
    status: "committed",
    row,
    notificationWritten: statement.wroteNotification?.(row) ?? false,
  };
}
