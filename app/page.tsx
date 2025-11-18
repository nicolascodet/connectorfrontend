"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Loader2, Send } from "lucide-react";
import ModernBusinessDashboard from "@/components/dashboard/ModernBusinessDashboard";
import DemoWelcomeTour from "@/components/demo/DemoWelcomeTour";

export default function DashboardPage() {
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDemoWelcome, setShowDemoWelcome] = useState(false);

  // Check if user needs to see demo welcome flow
  useEffect(() => {
    if (isDemoMode && !loading) {
      const emailCaptured = localStorage.getItem("demo_email_captured");
      if (!emailCaptured) {
        setShowDemoWelcome(true);
      }
    }
  }, [isDemoMode, loading]);

  // Debug: Log demo mode status
  useEffect(() => {
    console.log("🎭 Demo Mode Status:", {
      isDemoMode,
      user: user ? "Present" : "None",
      loading,
      env: process.env.NEXT_PUBLIC_DEMO_MODE
    });
  }, [isDemoMode, user, loading]);

  useEffect(() => {
    // Skip login redirect in demo mode
    if (isDemoMode) {
      console.log("✅ Demo mode active - skipping login redirect");
      return;
    }

    if (!loading && !user) {
      console.log("❌ No user and not demo mode - redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router, isDemoMode]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const scrollContainer = document.querySelector('.overflow-y-auto');
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(chatInput)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-full">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
            🎭 Demo Mode - Viewing sample data without authentication
          </div>
        )}

        <div className="max-w-[1600px] mx-auto p-8 space-y-6">
          <ModernBusinessDashboard user={user} onModalOpenChange={setIsModalOpen} chatInput={chatInput} setChatInput={setChatInput} onChatSubmit={handleChatSubmit} />
        </div>
      </div>

      {/* Demo welcome tour overlay - shows over dashboard */}
      {showDemoWelcome && (
        <DemoWelcomeTour onComplete={() => setShowDemoWelcome(false)} />
      )}
    </div>
  );
}
