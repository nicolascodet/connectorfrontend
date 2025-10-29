"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Job {
  id: string;
  user_id: string;
  job_type: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: any;
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const url =
        filter === "all"
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/jobs/all?limit=100`
          : `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/jobs/all?status=${filter}&limit=100`;

      const res = await fetch(url, {
        headers: { "X-Admin-Session": token },
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const retryJob = async (jobId: string) => {
    const token = localStorage.getItem("admin_session_token");
    setRetrying(jobId);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/jobs/${jobId}/retry`,
        {
          method: "POST",
          headers: { "X-Admin-Session": token! },
        }
      );

      if (res.ok) {
        alert("✅ Job retry queued!");
        fetchJobs();
      } else {
        const error = await res.json();
        alert(`❌ Retry failed: ${error.detail}`);
      }
    } catch (error) {
      alert(`❌ Retry failed: ${error}`);
    } finally {
      setRetrying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sync Jobs</h1>
          <p className="text-gray-400 mt-2">
            View and manage all background sync jobs
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "queued", "running", "completed", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-white capitalize">
                      {job.job_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {job.user_id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {job.started_at && job.completed_at
                        ? `${Math.round(
                            (new Date(job.completed_at).getTime() -
                              new Date(job.started_at).getTime()) /
                              1000
                          )}s`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {job.status === "failed" && (
                          <button
                            onClick={() => retryJob(job.id)}
                            disabled={retrying === job.id}
                            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                          >
                            {retrying === job.id ? "Retrying..." : "Retry"}
                          </button>
                        )}
                        {job.error_message && (
                          <button
                            onClick={() => alert(job.error_message)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            View Error
                          </button>
                        )}
                      </div>
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

function StatusBadge({ status }: { status: string }) {
  const colors = {
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    queued: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const icons = {
    completed: "✅",
    running: "⏳",
    failed: "❌",
    queued: "⏸️",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
        colors[status as keyof typeof colors] || colors.queued
      }`}
    >
      {icons[status as keyof typeof icons] || "⏸️"} {status}
    </span>
  );
}
