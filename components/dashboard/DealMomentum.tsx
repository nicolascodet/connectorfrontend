"use client";

import { useEffect, useState } from "react";
import { getDealMomentum } from "@/lib/api";
import { Flame, Loader2, AlertTriangle, TrendingUp, Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Deal {
  name: string;
  touchpoints_this_week: number;
  touchpoints_last_week: number;
  last_mention_date: string;
  days_since_last_mention: number;
  status: "hot" | "warm" | "cold";
  trend: "up" | "down" | "stable";
  velocity_percent: number;
}

export default function DealMomentum() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getDealMomentum(30);
      setDeals(result.deals || []);
    } catch (err) {
      console.error("Failed to load deal momentum:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDealClick = (dealName: string) => {
    router.push(`/search?q=${encodeURIComponent(dealName)}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "hot":
        return <Flame className="h-4 w-4 text-red-600" />;
      case "cold":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-red-50 border-red-200 text-red-700";
      case "cold":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

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
          <Flame className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Deal Momentum</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const hotDeals = deals.filter(d => d.status === "hot");
  const coldDeals = deals.filter(d => d.status === "cold");

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Flame className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Deal Momentum</h3>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No active deals tracked yet</p>
          <p className="text-xs text-gray-400 mt-1">Deals are identified from your communications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hot Deals Section */}
          {hotDeals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-semibold text-gray-700">Hot Deals</h4>
                <span className="text-xs text-gray-500">({hotDeals.length})</span>
              </div>
              <div className="space-y-2">
                {hotDeals.slice(0, 3).map((deal, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDealClick(deal.name)}
                    className="w-full p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{deal.name}</p>
                          {deal.trend === "up" && (
                            <div className="flex items-center gap-0.5 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span className="text-xs font-medium">+{Math.abs(deal.velocity_percent)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{deal.touchpoints_this_week} touchpoints this week</span>
                          <span className="text-gray-400">•</span>
                          <span>{deal.days_since_last_mention}d ago</span>
                        </div>
                      </div>
                      <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cold Deals Section */}
          {coldDeals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-gray-700">Needs Attention</h4>
                <span className="text-xs text-gray-500">({coldDeals.length})</span>
              </div>
              <div className="space-y-2">
                {coldDeals.slice(0, 3).map((deal, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDealClick(deal.name)}
                    className="w-full p-3 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{deal.name}</p>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            Stalled
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>No activity in {deal.days_since_last_mention} days</span>
                        </div>
                      </div>
                      <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Active Deals */}
          {deals.length > 6 && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push('/search?q=all deals')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {deals.length} active deals →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Tracking momentum based on communication frequency • Click to search
        </p>
      </div>
    </div>
  );
}
