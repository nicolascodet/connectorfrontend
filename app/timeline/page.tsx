"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, Clock, Calendar } from "lucide-react";

export default function TimelinePage() {
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-8 w-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">Timeline</h1>
            </div>
            <p className="text-gray-600">View your company's history over time</p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline View Coming Soon</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Track your company's journey over time. See major events, document uploads, deals closed, and key milestones all in one place.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-500">
              <div className="px-4 py-2 bg-gray-100 rounded-lg">📧 Email history</div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg">💰 Revenue milestones</div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg">👥 Team growth</div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg">🎯 Deal progress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

