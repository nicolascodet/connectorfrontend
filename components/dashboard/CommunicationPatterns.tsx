"use client";

import { useEffect, useState } from "react";
import { getCommunicationPatterns } from "@/lib/api";
import { Network, Loader2, Mail, TrendingUp, Users } from "lucide-react";

interface CommunicationEdge {
  from: string;
  to: string;
  count: number;
  avg_response_time_hours?: number;
}

interface TopCommunicator {
  name: string;
  email_count: number;
  unique_contacts: number;
}

export default function CommunicationPatterns() {
  const [edges, setEdges] = useState<CommunicationEdge[]>([]);
  const [topSenders, setTopSenders] = useState<TopCommunicator[]>([]);
  const [topRecipients, setTopRecipients] = useState<TopCommunicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getCommunicationPatterns(30);
      setEdges(result.edges || []);
      setTopSenders(result.top_senders || []);
      setTopRecipients(result.top_recipients || []);
    } catch (err) {
      console.error("Failed to load communication patterns:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
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
          <Network className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Communication Patterns</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Network className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Communication Patterns</h3>
      </div>

      {topSenders.length === 0 && topRecipients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No communication data yet</p>
          <p className="text-xs text-gray-400 mt-1">Connect your email to see patterns</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Communicators */}
          <div className="grid grid-cols-2 gap-4">
            {/* Most Active Senders */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-700">Most Active Senders</h4>
              </div>
              <div className="space-y-2">
                {topSenders.slice(0, 3).map((sender, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {sender.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{sender.name}</p>
                        <p className="text-xs text-gray-500">{sender.email_count} emails</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{sender.unique_contacts} contacts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Recipients */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-gray-700">Most Active Recipients</h4>
              </div>
              <div className="space-y-2">
                {topRecipients.slice(0, 3).map((recipient, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">
                          {recipient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{recipient.name}</p>
                        <p className="text-xs text-gray-500">{recipient.email_count} emails</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Connections */}
          {edges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-700">Top Connections</h4>
              </div>
              <div className="space-y-2">
                {edges.slice(0, 3).map((edge, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">{edge.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">{edge.to}</span>
                      </div>
                      <span className="text-xs font-medium text-purple-600">{edge.count} emails</span>
                    </div>
                    {edge.avg_response_time_hours !== undefined && (
                      <p className="text-xs text-gray-500">
                        Avg response: {Math.round(edge.avg_response_time_hours)}h
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Email activity patterns from last 30 days
        </p>
      </div>
    </div>
  );
}
