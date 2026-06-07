/**
 * v1 public launch scope (Option A — Focused v1).
 * Flip flags to true when a deferred feature is ready to ship.
 */
export const LAUNCH_V1 = {
  /** Import accounting data and compare vs forecast */
  actuals: false,
  /** Org invites and shared plan access */
  team: false,
} as const;
