"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, Bot, Zap, Brain, Search } from "lucide-react";

export default function AgentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const agentTypes = [
    {
      name: "Research Agent",
      icon: Search,
      description: "Continuously monitors your data for specific topics or trends",
      status: "Coming Soon",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Alert Agent",
      icon: Zap,
      description: "Watches for important events and notifies you immediately",
      status: "Coming Soon",
      color: "from-yellow-500 to-orange-600",
    },
    {
      name: "Analysis Agent",
      icon: Brain,
      description: "Runs periodic analyses on your data and generates insights",
      status: "Coming Soon",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">AI Agents</h1>
            </div>
            <p className="text-gray-600">Deploy autonomous agents to monitor and analyze your data</p>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white mb-8">
            <h2 className="text-2xl font-bold mb-2">What are AI Agents?</h2>
            <p className="text-white/90">
              AI Agents are autonomous systems that continuously monitor your hybrid search (vector + knowledge graph) 
              to achieve specific goals. They can research topics, watch for events, and generate insights automatically.
            </p>
          </div>

          {/* Agent Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {agentTypes.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div
                  key={i}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {agent.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Use Cases */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Example Use Cases</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Competitor Monitoring",
                  description: "Track mentions of competitors in emails and documents, alert when significant activity detected",
                },
                {
                  title: "Revenue Insights",
                  description: "Analyze financial data daily and notify about anomalies or opportunities",
                },
                {
                  title: "Customer Sentiment",
                  description: "Monitor customer communications and flag issues before they escalate",
                },
                {
                  title: "Deal Intelligence",
                  description: "Track deal progress across all systems and predict close probabilities",
                },
              ].map((useCase, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-semibold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{useCase.title}</h3>
                    <p className="text-sm text-gray-600">{useCase.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

