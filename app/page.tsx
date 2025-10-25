"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      // Redirect to chat immediately - no dashboard
      router.push("/chat");
    }
  }, [user, loading, router]);

  // Show loading state while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
    </div>
  );
}
