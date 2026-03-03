/**
 * Infrastructure Usage Examples
 * Demonstrating how foundational guardrails enforce architectural discipline
 */

import { NeedStatus, UserRole } from '@prisma/client';
import {
  validateNeedTransition,
  isTerminalStatus,
  getValidNextStatuses,
} from './validators/need-lifecycle.validator';

// ============================================================================
// Example 1: Need Lifecycle Validation
// ============================================================================

// Valid transition: open → in_review
validateNeedTransition(NeedStatus.open, NeedStatus.in_review); // ✓ Success

// Valid transition: open → attempted_not_found
validateNeedTransition(NeedStatus.open, NeedStatus.attempted_not_found); // ✓ Success

// Invalid transition: open → delivered (skips intermediate states)
// validateNeedTransition(NeedStatus.open, NeedStatus.delivered);
// ✗ Throws: "Invalid status transition: open → delivered"

// Terminal state check
isTerminalStatus(NeedStatus.delivered); // true
isTerminalStatus(NeedStatus.open); // false

// Get valid next statuses
getValidNextStatuses(NeedStatus.open); // ['in_review', 'attempted_not_found']
getValidNextStatuses(NeedStatus.delivered); // [] (terminal)

// ============================================================================
// Example 2: BaseService Pattern (pseudocode - not executable)
// ============================================================================

/*
class FriendsService extends BaseService {
  async findById(id: string, orgId: string) {
    // Automatically scoped by org_id
    return this.prisma.friend.findFirst({
      where: this.withOrgScope(orgId, { id }),
    });
  }

  async update(id: string, orgId: string, data: any) {
    const friend = await this.findById(id, orgId);
    
    // Validate cross-org access attempt
    this.validateOrgAccess(friend.org_id, orgId);
    
    return this.prisma.friend.update({
      where: { id },
      data,
    });
  }
}
*/

// ============================================================================
// Example 3: RolesGuard Usage (pseudocode - not executable)
// ============================================================================

/*
@Controller('needs')
export class NeedsController {
  // Only admin and manager can change status to 'sourcing'
  @Patch(':id/status')
  @Roles(UserRole.admin, UserRole.manager)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: RequestContext,
  ) {
    // user.orgId is automatically extracted from JWT
    // user.role determines authorization via RolesGuard
    // All queries scoped by user.orgId in service layer
  }

  // Volunteers can mark as delivered
  @Patch(':id/delivered')
  @Roles(UserRole.volunteer, UserRole.manager, UserRole.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async markDelivered(
    @Param('id') id: string,
    @CurrentUser() user: RequestContext,
  ) {
    // Enforces volunteer permission per Section 8
  }
}
*/

export {};
