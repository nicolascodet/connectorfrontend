"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SystemMetrics {
  documents: { total: number };
  sync_jobs: { total: number };
  qdrant: { vectors: number | string };
  neo4j: { nodes: number | string; relationships: number | string };
}

interface RecentJob {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  user_id: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      // Fetch metrics
      const metricsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/metrics/overview`,
        { headers: { "X-Admin-Session": token } }
      );
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      // Fetch recent jobs
      const jobsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/jobs/all?limit=10`,
        { headers: { "X-Admin-Session": token } }
      );
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setRecentJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">System overview and quick actions</p>
      </div>

      {/* System Health Badge */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-semibold text-white">All Systems Operational</h2>
            </div>
            <p className="text-gray-400 mt-1 text-sm">Last checked: just now</p>
          </div>
          <Link
            href="/admin/health"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Documents"
          value={metrics?.documents.total?.toLocaleString() || "0"}
          icon="📄"
          color="blue"
        />
        <MetricCard
          title="Vector Embeddings"
          value={metrics?.qdrant.vectors?.toLocaleString() || "N/A"}
          icon="🔢"
          color="purple"
        />
        <MetricCard
          title="Knowledge Graph Nodes"
          value={metrics?.neo4j.nodes?.toLocaleString() || "N/A"}
          icon="🕸️"
          color="green"
        />
        <MetricCard
          title="Total Sync Jobs"
          value={metrics?.sync_jobs.total?.toLocaleString() || "0"}
          icon="🔄"
          color="orange"
        />
      </div>

      {/* Recent Jobs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Sync Jobs</h2>
          <Link
            href="/admin/jobs"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="divide-y divide-slate-700">
          {recentJobs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No sync jobs yet
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="px-6 py-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={job.status} />
                    <div>
                      <div className="text-white font-medium capitalize">
                        {job.job_type} Sync
                      </div>
                      <div className="text-sm text-gray-400">
                        User: {job.user_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(job.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            title="Run Health Check"
            icon="🏥"
            href="/admin/health"
          />
          <QuickAction
            title="Manage Connectors"
            icon="🔌"
            href="/admin/connectors"
          />
          <QuickAction
            title="View Jobs"
            icon="📊"
            href="/admin/jobs"
          />
          <QuickAction
            title="Edit Company Info"
            icon="🏢"
            href="/admin/company"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-6`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
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
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        colors[status as keyof typeof colors] || colors.queued
      }`}
    >
      {icons[status as keyof typeof icons] || "⏸️"} {status}
    </span>
  );
}

function QuickAction({
  title,
  icon,
  href,
}: {
  title: string;
  icon: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600"
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-medium text-white">{title}</div>
    </Link>
  );
}
