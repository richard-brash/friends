export const USER_ROLES = ['admin', 'manager', 'volunteer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CONSENT_SCOPES = ['verbal', 'limited', 'none'] as const;
export type ConsentScope = (typeof CONSENT_SCOPES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const NEED_STATUSES = [
  'open',
  'in_review',
  'sourcing',
  'ready',
  'out_for_delivery',
  'delivered',
  'attempted_not_found',
  'closed_unable',
] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];