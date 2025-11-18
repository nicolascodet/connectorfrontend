"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Search as SearchIcon,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Trash2,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getChatHistory, deleteChat, type ChatHistoryItem } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  user?: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isDemoMode } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Team", href: "/team", icon: Users },
    { name: "Daily Reports", href: "/daily-reports", icon: Calendar },
  ];

  // Load chat history only once when user is available
  useEffect(() => {
    if (user && chatHistory.length === 0) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const result = await getChatHistory();
      setChatHistory(result.chats || []);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      toast({
        title: "Chat deleted",
        description: "Chat has been deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat",
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
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-64 border-r flex flex-col relative" style={{ backgroundColor: '#30465C', borderColor: '#1a2635', borderBottomRightRadius: '16px', height: '100%' }}>
      {/* Top-right convex curve - creates "r" shape using radial gradient */}
      <div
        className="absolute top-0"
        style={{
          right: '-16px',
          width: '16px',
          height: '16px',
          background: 'radial-gradient(circle at bottom right, transparent 15.5px, #30465C 16.5px)',
          zIndex: 10
        }}
      ></div>
      {/* Logo */}
      <div className="px-5 pt-4 pb-0.5">
        <Link href="/">
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/highforce-logo-cropped.png" alt="HighForce" className="h-16 w-auto brightness-0 invert" style={{ objectFit: 'contain', objectPosition: 'left center' }} />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 pl-0 pr-4">
        <nav className="mb-6 mt-14">
          {/* Search */}
          <div className="relative pl-4 mb-3">
            {pathname === "/search" && (
              <div className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full z-10" style={{ left: 0 }} />
            )}
            <Button
              onClick={() => router.push("/search")}
              variant={pathname === "/search" ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm font-normal ${
                pathname === "/search"
                  ? "bg-white/20 text-white hover:bg-white/30 rounded-l-md rounded-r-md"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              size="sm"
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Dashboard & Reports */}
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className="relative pl-4 mb-3">
                  {isActive && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full z-10" style={{ left: 0 }} />
                  )}
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start text-sm font-normal ${
                      isActive
                        ? "bg-white/20 text-white hover:bg-white/30 rounded-l-md rounded-r-md"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                    size="sm"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Chat History Section - Hidden in demo mode */}
        {!isDemoMode && (
          <>
            <Separator className="my-4 mx-4 bg-white/20" />
            <div className="pt-2 pl-4">
              <Button
                variant="ghost"
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="w-full justify-between text-sm font-normal text-white/80 hover:bg-white/10 hover:text-white"
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Recent Chats</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${historyExpanded ? '' : '-rotate-90'}`} />
              </Button>

              {historyExpanded && (
                <div className="mt-3 space-y-1">
                  {loadingHistory ? (
                    <div className="px-3 py-2 text-sm font-light text-white/60">Loading...</div>
                  ) : chatHistory.length === 0 ? (
                    <div className="px-3 py-2 text-sm font-light text-white/60">No chats yet</div>
                  ) : (
                    chatHistory.slice(0, 10).map((chat) => (
                      <div
                        key={chat.id}
                        className="relative group/chat mb-1"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/search?chat_id=${chat.id}`)}
                          className="w-full justify-start h-auto py-2 px-3 text-sm font-normal text-white/80 hover:bg-white/10 hover:text-white"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-left pr-6">
                            <p className="text-sm font-normal truncate">
                              {chat.title || "Untitled Chat"}
                            </p>
                            <p className="text-xs text-white/60 font-light mt-0.5">
                              {formatTimestamp(chat.created_at)}
                            </p>
                          </div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 h-6 w-6 text-white hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 pl-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-light truncate text-white">
              {mounted && user?.email ? user.email.split("@")[0] : "Loading..."}
            </p>
            <p className="text-xs text-white/60 font-light">Admin</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Hide Settings in demo mode */}
          {!isDemoMode && (
            <Button
              variant="ghost"
              onClick={() => router.push("/connections")}
              className="w-full justify-start text-sm font-normal text-white/80 hover:bg-white/10 hover:text-white"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start text-sm font-normal text-white/80 hover:bg-white/10 hover:text-white"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
