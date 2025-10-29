"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  user_id: string;
  last_syncs: {
    gmail?: any;
    outlook?: any;
    drive?: any;
  };
}

export default function AdminConnectorsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/connectors/users`,
        { headers: { "X-Admin-Session": token } }
      );

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (userId: string, provider: string) => {
    const token = localStorage.getItem("admin_session_token");
    setSyncing(`${userId}-${provider}`);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/connectors/sync`,
        {
          method: "POST",
          headers: {
            "X-Admin-Session": token!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId, provider }),
        }
      );

      if (res.ok) {
        alert(`✅ ${provider} sync started for user!`);
        fetchUsers(); // Refresh
      } else {
        const error = await res.json();
        alert(`❌ Sync failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`❌ Sync failed: ${error}`);
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading connectors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Connector Management</h1>
          <p className="text-gray-400 mt-2">
            View all user connections and trigger manual syncs
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Gmail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Outlook
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Drive
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {user.user_id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4">
                      <ConnectionCell
                        provider="gmail"
                        sync={user.last_syncs.gmail}
                        userId={user.user_id}
                        onSync={triggerSync}
                        syncing={syncing === `${user.user_id}-gmail`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ConnectionCell
                        provider="outlook"
                        sync={user.last_syncs.outlook}
                        userId={user.user_id}
                        onSync={triggerSync}
                        syncing={syncing === `${user.user_id}-outlook`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ConnectionCell
                        provider="drive"
                        sync={user.last_syncs.drive}
                        userId={user.user_id}
                        onSync={triggerSync}
                        syncing={syncing === `${user.user_id}-drive`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-blue-400 hover:text-blue-300">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConnectionCell({
  provider,
  sync,
  userId,
  onSync,
  syncing,
}: {
  provider: string;
  sync: any;
  userId: string;
  onSync: (userId: string, provider: string) => void;
  syncing: boolean;
}) {
  if (!sync) {
    return <span className="text-sm text-gray-500">Not connected</span>;
  }

  const statusColor =
    sync.status === "completed"
      ? "text-green-400"
      : sync.status === "failed"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={`text-sm ${statusColor}`}>
          {sync.status === "completed"
            ? "✅"
            : sync.status === "failed"
            ? "❌"
            : "⏳"}
        </span>
        <span className="text-xs text-gray-400">
          {sync.created_at
            ? new Date(sync.created_at).toLocaleDateString()
            : "Never"}
        </span>
      </div>
      <button
        onClick={() => onSync(userId, provider)}
        disabled={syncing}
        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
