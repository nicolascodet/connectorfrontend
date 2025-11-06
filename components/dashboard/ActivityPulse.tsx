"use client";

import { useEffect, useState } from "react";
import { getDailyTrends } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface DailyTrend {
  date: string;
  total_documents: number;
  document_counts: Record<string, number>;
}

export default function ActivityPulse() {
  const [data, setData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getDailyTrends(30);
      setData(result.trends || []);
    } catch (err) {
      console.error("Failed to load activity pulse:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return { direction: "neutral", percent: 0 };

    const recent = data.slice(-7).reduce((sum, d) => sum + d.total_documents, 0);
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.total_documents, 0);

    if (previous === 0) return { direction: "neutral", percent: 0 };

    const percent = ((recent - previous) / previous) * 100;
    return {
      direction: percent > 0 ? "up" : percent < 0 ? "down" : "neutral",
      percent: Math.abs(Math.round(percent))
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Pulse</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Pulse</h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {trend.direction === "up" ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{trend.percent}%</span>
            </>
          ) : trend.direction === "down" ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">-{trend.percent}%</span>
            </>
          ) : (
            <span className="text-gray-500 font-medium">No change</span>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <Line
              type="monotone"
              dataKey="total_documents"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5 }}
              name="Documents"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Last 30 days of activity across all connected sources
        </p>
      </div>
    </div>
  );
}
