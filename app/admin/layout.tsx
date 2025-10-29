"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("admin_session_token");
      const expires = localStorage.getItem("admin_session_expires");

      if (!token || !expires) {
        if (pathname !== "/admin") {
          router.push("/admin");
        }
        setLoading(false);
        return;
      }

      // Check if token expired
      const expiresAt = new Date(expires);
      if (expiresAt < new Date()) {
        localStorage.removeItem("admin_session_token");
        localStorage.removeItem("admin_session_expires");
        if (pathname !== "/admin") {
          router.push("/admin");
        }
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_session_token");
    localStorage.removeItem("admin_session_expires");
    router.push("/admin");
  };

  // If on login page, don't show navigation
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect (this is just UI, useEffect handles actual redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Admin dashboard layout with navigation
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-xl font-bold text-white">
                🔐 CORTEX Admin
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/admin/dashboard" current={pathname === "/admin/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/admin/health" current={pathname === "/admin/health"}>
                Health
              </NavLink>
              <NavLink href="/admin/connectors" current={pathname === "/admin/connectors"}>
                Connectors
              </NavLink>
              <NavLink href="/admin/jobs" current={pathname === "/admin/jobs"}>
                Jobs
              </NavLink>
              <NavLink href="/admin/schema" current={pathname === "/admin/schema"}>
                Schema
              </NavLink>
              <NavLink href="/admin/company" current={pathname === "/admin/company"}>
                Company
              </NavLink>
            </div>

            {/* Logout */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        current
          ? "bg-slate-700 text-white"
          : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
