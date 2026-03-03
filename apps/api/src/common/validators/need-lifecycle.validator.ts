import { NeedStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

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
  [NeedStatus.open]: [NeedStatus.in_review, NeedStatus.attempted_not_found],
  [NeedStatus.in_review]: [NeedStatus.sourcing],
  [NeedStatus.sourcing]: [NeedStatus.ready],
  [NeedStatus.ready]: [NeedStatus.out_for_delivery],
  [NeedStatus.out_for_delivery]: [NeedStatus.delivered],
  [NeedStatus.attempted_not_found]: [NeedStatus.closed_unable],
  [NeedStatus.delivered]: [], // Terminal state
  [NeedStatus.closed_unable]: [], // Terminal state
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
