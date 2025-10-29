"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface HealthStatus {
  status: string;
  components: {
    database?: { status: string; latency_ms?: number; error?: string };
    qdrant?: { status: string; vectors_count?: number; points_count?: number; error?: string };
    neo4j?: { status: string; nodes_count?: number; error?: string };
    redis?: { status: string; error?: string };
  };
  timestamp: string;
}

export default function AdminHealthPage() {
  const router = useRouter();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/health/full`,
        { headers: { "X-Admin-Session": token } }
      );

      if (res.ok) {
        setHealth(await res.json());
      }
    } catch (error) {
      console.error("Error fetching health:", error);
    } finally {
      setLoading(false);
    }
  };

  const runEndToEndTest = async () => {
    setTesting(true);
    const token = localStorage.getItem("admin_session_token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/health/test-flow`,
        {
          method: "POST",
          headers: { "X-Admin-Session": token! },
        }
      );

      const data = await res.json();
      alert(
        data.status === "success"
          ? "✅ End-to-end test passed!"
          : `❌ Test failed: ${data.error}`
      );
    } catch (error) {
      alert(`❌ Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading health status...</div>
      </div>
    );
  }

  const overallHealthy = health?.status === "healthy";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 mt-2">Component status and diagnostics</p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div
        className={`rounded-xl p-6 border ${
          overallHealthy
            ? "bg-green-500/20 border-green-500/30"
            : "bg-red-500/20 border-red-500/30"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-4 h-4 rounded-full ${
              overallHealthy ? "bg-green-500" : "bg-red-500"
            } animate-pulse`}
          ></div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {overallHealthy ? "All Systems Operational" : "System Degraded"}
            </h2>
            <p className="text-gray-400 mt-1">
              Last checked: {new Date(health?.timestamp || "").toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComponentCard
          title="Database (Supabase)"
          icon="🗄️"
          status={health?.components.database?.status || "unknown"}
          details={
            health?.components.database?.latency_ms
              ? `Latency: ${health.components.database.latency_ms}ms`
              : health?.components.database?.error
          }
        />

        <ComponentCard
          title="Vector DB (Qdrant)"
          icon="🔢"
          status={health?.components.qdrant?.status || "unknown"}
          details={
            health?.components.qdrant?.vectors_count
              ? `${health.components.qdrant.vectors_count.toLocaleString()} vectors`
              : health?.components.qdrant?.error
          }
        />

        <ComponentCard
          title="Knowledge Graph (Neo4j)"
          icon="🕸️"
          status={health?.components.neo4j?.status || "unknown"}
          details={
            health?.components.neo4j?.nodes_count
              ? `${health.components.neo4j.nodes_count.toLocaleString()} nodes`
              : health?.components.neo4j?.error
          }
        />

        <ComponentCard
          title="Background Jobs (Redis)"
          icon="⚙️"
          status={health?.components.redis?.status || "unknown"}
          details={health?.components.redis?.error || "Queue processing active"}
        />
      </div>

      {/* End-to-End Test */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          End-to-End Test
        </h2>
        <p className="text-gray-400 mb-4">
          Run a complete flow test: create document → ingest → chunk → embed → query → cleanup
        </p>
        <button
          onClick={runEndToEndTest}
          disabled={testing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? "Running Test..." : "▶️ Run Test Flow"}
        </button>
      </div>
    </div>
  );
}

function ComponentCard({
  title,
  icon,
  status,
  details,
}: {
  title: string;
  icon: string;
  status: string;
  details?: string;
}) {
  const isHealthy = status === "healthy";

  return (
    <div
      className={`bg-slate-800 rounded-xl border p-6 ${
        isHealthy
          ? "border-green-500/30"
          : "border-red-500/30"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isHealthy
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isHealthy ? "✅ Healthy" : "❌ Unhealthy"}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

      {details && (
        <p
          className={`text-sm ${
            isHealthy ? "text-gray-400" : "text-red-400"
          }`}
        >
          {details}
        </p>
      )}
    </div>
  );
}
