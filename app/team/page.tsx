'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import InviteUserModal from '@/components/team/InviteUserModal';
import { Users, Mail, Shield, Clock, UserPlus, Trash2 } from 'lucide-react';

interface CompanyUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface UsersListResponse {
  users: CompanyUser[];
  total: number;
}

export default function TeamPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users' }));
        throw new Error(errorData.detail || 'Failed to fetch users');
      }

      const data: UsersListResponse = await response.json();
      setUsers(data.users || []);

      // Find current user's role
      const currentUser = data.users?.find(u => u.user_id === user.id);
      if (currentUser) {
        setCurrentUserRole(currentUser.role);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    fetchUsers(); // Refresh user list
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the company?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to remove user');
      }

      // Refresh user list
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove user');
    }
  };

  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const getRoleBadge = (role: string) => {
    const badges = {
      owner: { icon: Shield, color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Owner' },
      admin: { icon: Shield, color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Admin' },
      user: { icon: Users, color: 'bg-green-100 text-green-700 border-green-300', label: 'User' },
      viewer: { icon: Users, color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Viewer' },
    };
    return badges[role as keyof typeof badges] || badges.viewer;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading your team...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.is_active);
  const pendingUsers = users.filter(u => !u.is_active);

  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-10 h-10 text-blue-600" />
                Team Management
              </h1>
              <p className="mt-3 text-lg text-gray-600">
                Manage your company members, roles, and permissions
              </p>
            </div>
            {canManageUsers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Invite User
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Mail className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Role</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{currentUserRole || 'Member'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-red-600">⚠️</div>
              <div>
                <p className="font-medium text-red-900">Error loading team</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-600 mb-6">Get started by inviting your first team member</p>
            {canManageUsers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Invite Your First User
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Joined
                    </th>
                    {canManageUsers && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((companyUser) => {
                    const roleBadge = getRoleBadge(companyUser.role);
                    const RoleIcon = roleBadge.icon;
                    const isCurrentUser = companyUser.user_id === user?.id;

                    return (
                      <tr key={companyUser.id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 h-11 w-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-semibold text-base">
                                {companyUser.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {companyUser.email}
                                {isCurrentUser && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Member since {formatDate(companyUser.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border ${roleBadge.color}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {companyUser.is_active ? (
                            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(companyUser.last_login_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(companyUser.created_at)}
                        </td>
                        {canManageUsers && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {!isCurrentUser && (
                              <button
                                onClick={() => handleRemoveUser(companyUser.user_id, companyUser.email)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                title="Remove user"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        {users.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-600 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{activeUsers.length} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{pendingUsers.length} Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{users.length} Total</span>
              </div>
            </div>
            {!canManageUsers && (
              <div className="text-xs text-gray-500 italic">
                Contact an admin or owner to invite new users
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
          session={session}
        />
      )}
    </div>
  );
}
