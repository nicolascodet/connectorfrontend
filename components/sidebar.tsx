"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  ChevronDown,
  LogOut,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  user?: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigation = [
    { name: "New chat", href: "/", icon: MessageSquarePlus },
  ];

  return (
    <div className="w-64 h-screen bg-gray-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
          <span className="text-xl font-semibold text-white">Cortex</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <Link href="/">
          <Button className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl py-6">
            <MessageSquarePlus className="h-5 w-5" />
            New chat
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        {settingsOpen ? (
          <div className="bg-white/10 rounded-2xl p-4 space-y-2 mb-3">
            <Link href="/connections" className="flex items-center gap-3 px-3 py-2 w-full text-left text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <Plug className="h-4 w-4" />
              <span className="text-sm">Connections</span>
            </Link>
            <div className="h-px bg-white/10 my-2" />
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-400 hover:text-red-300 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        ) : null}

        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
            {user?.email?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">
              {user?.email?.split("@")[0] || "Sophia"}
            </p>
            <p className="text-xs text-white/60">Pro Plan</p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-white/60 transition-transform ${
              settingsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}

