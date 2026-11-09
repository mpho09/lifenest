/**
 * BR10: the 8 checklist items on S7, in PRD order. `todo` opens the screen that
 * completes the item (with the right category chosen); `done` opens its list.
 */
export const READINESS_ITEMS = [
  { key: 'profile', label: 'Complete your profile', todo: '/profile-setup', done: '/more' },
  { key: 'identity', label: 'Add an ID document', todo: '/document/edit?category=identity', done: '/documents' },
  { key: 'insurance', label: 'Add an insurance policy', todo: '/asset/edit?category=insurance&type=policy', done: '/assets' },
  { key: 'property_vehicles', label: 'Add a vehicle or tick I don’t own any', todo: '/asset/edit?category=vehicles&type=vehicle', done: '/assets' },
  { key: 'banking', label: 'Add a bank or investment account', todo: '/asset/edit?category=banking_investments&type=bank_account', done: '/assets' },
  { key: 'emergency', label: 'Complete your emergency profile', todo: '/emergency-profile', done: '/emergency-profile' },
  { key: 'contact', label: 'Add someone you trust', todo: '/contact/edit', done: '/people' },
  { key: 'instruction', label: 'Write your first instruction', todo: '/instructions/edit?kind=instruction', done: '/instructions' },
] as const;

export type ReadinessKey = (typeof READINESS_ITEMS)[number]['key'];

/** BR11: the review card shows 180 days after the owner last confirmed. */
export const REVIEW_AFTER_DAYS = 180;

export function isReviewDue(lastReviewedAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastReviewedAt) return false;
  return now - new Date(lastReviewedAt).getTime() >= REVIEW_AFTER_DAYS * 86_400_000;
}
