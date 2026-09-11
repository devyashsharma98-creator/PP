/**
 * `server-only` throws when imported outside a React Server Component. The
 * service modules under test are server modules, and in the vitest runner the
 * guard has nothing to protect against, so it is aliased to this no-op.
 */
export {};
