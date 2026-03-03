import { BadRequestException } from '@nestjs/common';
import { type NeedStatus } from '../types/domain-types';

/**
 * Need Lifecycle State Machine
 * Per MVP-Architecture.md Section 7
 *
 * Allowed transitions:
 * open → in_review → sourcing → ready → out_for_delivery → delivered
 * OR
 * open → attempted_not_found → closed_unable
 *
 * Rules:
 * - No backward transitions
 * - delivered is terminal
 * - closed_unable is terminal
 */

const VALID_TRANSITIONS: Record<NeedStatus, NeedStatus[]> = {
  open: ['in_review', 'attempted_not_found'],
  in_review: ['sourcing'],
  sourcing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  attempted_not_found: ['closed_unable'],
  delivered: [], // Terminal state
  closed_unable: [], // Terminal state
};

/**
 * Validates if a need status transition is allowed per the lifecycle state machine
 *
 * @param currentStatus - Current status of the need
 * @param newStatus - Desired new status
 * @throws BadRequestException if transition is not allowed
 */
export function validateNeedTransition(
  currentStatus: NeedStatus,
  newStatus: NeedStatus,
): void {
  // No-op if status unchanged
  if (currentStatus === newStatus) {
    return;
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestException(
      `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed transitions from ${currentStatus}: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`,
    );
  }
}

/**
 * Checks if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: NeedStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/**
 * Gets all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: NeedStatus): NeedStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}
