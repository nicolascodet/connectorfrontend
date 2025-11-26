'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Users, Building2, UserCheck, X } from 'lucide-react';

interface ManageTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
  session: Session | null;
  currentUserRole: string;
}

interface CompanyUser {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
}

interface TeamMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
}

export default function ManageTeamModal({ onClose, onSuccess, session, currentUserRole }: ManageTeamModalProps) {
  const [availableUsers, setAvailableUsers] = useState<CompanyUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningUser, setAssigningUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all company users
      const usersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();

      // Fetch team members
      const teamResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/teams/members`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!teamResponse.ok) throw new Error('Failed to fetch team members');
      const teamData = await teamResponse.json();

      setTeamMembers(teamData.team_members || []);

      // Filter available users: only 'user' role, active, not already in team
      const teamUserIds = new Set((teamData.team_members || []).map((m: TeamMember) => m.user_id));
      const available = (usersData.users || []).filter((u: CompanyUser) => 
        u.role === 'user' && 
        u.is_active && 
        !teamUserIds.has(u.user_id)
      );

      setAvailableUsers(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToTeam = async (userEmail: string, department?: string) => {
    setAssigningUser(userEmail);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/teams/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_email: userEmail,
            department: department || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to assign user to team');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign user');
    } finally {
      setAssigningUser(null);
    }
  };

  const handleRemoveFromTeam = async (userEmail: string) => {
    if (!confirm(`Remove ${userEmail} from your team?`)) return;

    setRemovingUser(userEmail);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/teams/remove`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            user_email: userEmail,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to remove user from team');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user');
    } finally {
      setRemovingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              Manage Your Team
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentUserRole === 'owner' ? 'All company members' : 'Assign users to your team'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Current Team Members */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              Your Team Members ({teamMembers.length})
            </h3>
            
            {teamMembers.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No team members yet</p>
                <p className="text-sm text-gray-500 mt-1">Assign users below to build your team</p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.email}</p>
                        {member.department && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {member.department}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromTeam(member.email)}
                      disabled={removingUser === member.email}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {removingUser === member.email ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Users to Assign */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Available Users ({availableUsers.length})
            </h3>

            {availableUsers.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No users available to assign</p>
                <p className="text-sm text-gray-500 mt-1">All eligible users are already on your team</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">Role: {user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignToTeam(user.email)}
                      disabled={assigningUser === user.email}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 text-sm"
                    >
                      {assigningUser === user.email ? 'Assigning...' : 'Assign to Team'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Team Management</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Admins:</strong> See their own data + their team's data</li>
              <li>• <strong>Users:</strong> See only their own data (unless on a team)</li>
              <li>• <strong>Owners:</strong> See all company data</li>
              <li>• Only <strong>user</strong> role can be assigned to teams</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

