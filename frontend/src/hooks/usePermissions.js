import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking user permissions
 * This abstracts the permission logic and makes it easy to switch from roles to granular permissions later
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // Current role-based permission mapping (will be replaced with granular permissions later)
  const permissions = {
    // Run management permissions
    canScheduleRuns: user?.role && ['admin', 'coordinator'].includes(user.role),
    canEditRuns: user?.role && ['admin', 'coordinator'].includes(user.role),
    canDeleteRuns: user?.role && ['admin'].includes(user.role),
    canManageTeams: user?.role && ['admin', 'coordinator'].includes(user.role),
    
    // Route management permissions
    canCreateRoutes: user?.role && ['admin', 'coordinator'].includes(user.role),
    canEditRoutes: user?.role && ['admin', 'coordinator'].includes(user.role),
    canDeleteRoutes: user?.role && ['admin'].includes(user.role),
    
    // Location management permissions
    canCreateLocations: user?.role && ['admin', 'coordinator', 'volunteer'].includes(user.role),
    canEditLocations: user?.role && ['admin', 'coordinator'].includes(user.role),
    canDeleteLocations: user?.role && ['admin'].includes(user.role),
    
    // Friend management permissions
    canViewFriends: user?.role && ['admin', 'coordinator', 'volunteer'].includes(user.role),
    canEditFriends: user?.role && ['admin', 'coordinator'].includes(user.role),
    canDeleteFriends: user?.role && ['admin'].includes(user.role),
    
    // Request management permissions
    canTakeRequests: user?.role && ['admin', 'coordinator', 'volunteer'].includes(user.role),
    canViewAllRequests: user?.role && ['admin', 'coordinator'].includes(user.role),
    canEditRequests: user?.role && ['admin', 'coordinator'].includes(user.role),
    canDeleteRequests: user?.role && ['admin'].includes(user.role),
    
    // User management permissions
    canViewUsers: user?.role && ['admin', 'coordinator'].includes(user.role),
    canCreateUsers: user?.role && ['admin'].includes(user.role),
    canEditUsers: user?.role && ['admin'].includes(user.role),
    canDeleteUsers: user?.role && ['admin'].includes(user.role),
    
    // System permissions
    canViewDeveloperTools: user?.role && ['admin'].includes(user.role),
    canManageSettings: user?.role && ['admin'].includes(user.role),
    
    // Administrative permissions
    canViewReports: user?.role && ['admin', 'coordinator'].includes(user.role),
    canExportData: user?.role && ['admin'].includes(user.role)
  };

  return permissions;
};

/**
 * Future permission structure (when we migrate from roles to granular permissions):
 * 
 * Instead of checking roles, we'll check user.permissions array:
 * 
 * const permissions = {
 *   canScheduleRuns: user?.permissions?.includes('schedule_runs'),
 *   canEditRuns: user?.permissions?.includes('edit_runs'),
 *   canDeleteRuns: user?.permissions?.includes('delete_runs'),
 *   // ... etc
 * };
 * 
 * This hook isolates all permission logic in one place, making the future
 * migration much easier - we only need to update this file!
 */