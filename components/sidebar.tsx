"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  ChevronDown,
  LogOut,
  Plug,
  BarChart3,
  Clock,
  Bot,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getChatHistory, createNewChat, type ChatHistoryItem } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface SidebarProps {
  user?: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Views", href: "/views", icon: BarChart3 },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Timeline", href: "/timeline", icon: Clock },
    { name: "Agents", href: "/agents", icon: Bot },
  ];

  // Load chat history
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      setLoadingChats(true);
      const result = await getChatHistory();
      setChatHistory(result.chats);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const result = await createNewChat();
      router.push(`/chat?chat_id=${result.chat_id}`);
      toast({ title: "New chat created" });
      loadChatHistory(); // Refresh history
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create chat",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 h-screen bg-gray-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden">
      {/* Logo - Clickable to go home */}
      <div className="p-6">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-semibold text-white">Unit Industries</span>
          </div>
        </Link>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl py-6"
        >
          <MessageSquarePlus className="h-5 w-5" />
          New chat
        </Button>
      </div>

      {/* Scrollable middle section - contains chats and navigation */}
      <div className="flex-1 flex flex-col min-h-0 px-4">
        {/* Chat History - Constrained height */}
        <div className="flex-shrink-0">
          <div className="text-xs font-semibold text-white/50 mb-2 px-4">Recent Chats</div>
          <div className="space-y-1 mb-6 max-h-64 overflow-y-auto">
            {loadingChats ? (
              <div className="text-center text-white/50 text-sm py-4">Loading...</div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center text-white/50 text-sm py-4">No chats yet</div>
            ) : (
              <>
              {chatHistory.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat?chat_id=${chat.id}`}
                  className="block w-full text-left px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <div className="text-sm truncate">{chat.title || "New Chat"}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {formatTimestamp(chat.updated_at)} • {chat.message_count} messages
                  </div>
                </Link>
              ))}
                {chatHistory.length > 5 && (
                  <div className="text-center py-2">
                    <span className="text-xs text-white/40">
                      +{chatHistory.length - 5} more chats
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation - Always Visible */}
        <div className="flex-shrink-0">
          <div className="text-xs font-semibold text-white/50 mb-2 px-4">Pages</div>
          <nav className="space-y-1 mb-6">
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
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 pb-6 border-t border-white/10">
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

