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
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: FileText },
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
    <div className="w-64 h-screen bg-background border-r flex flex-col">
      {/* Logo */}
      <div className="px-5 py-0.5 border-b">
        <Link href="/">
          <div className="cursor-pointer hover:opacity-80 transition-opacity ml-3">
            <img src="/highforce-logo.png" alt="HighForce" className="h-36 w-auto" style={{ objectFit: 'contain', objectPosition: 'left center' }} />
          </div>
        </Link>
      </div>

      {/* Search Button */}
      <div className="px-4 py-4">
        <Button
          onClick={() => router.push("/search")}
          className="w-full"
          size="sm"
        >
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-1 mb-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Chat History Section */}
        <Separator className="my-4" />
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full justify-between px-3 h-8 text-xs font-semibold uppercase tracking-wide"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              <span>Recent Chats</span>
            </div>
            {historyExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>

          {historyExpanded && (
            <div className="mt-2 space-y-1">
              {loadingHistory ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
              ) : chatHistory.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No chats yet</div>
              ) : (
                chatHistory.slice(0, 10).map((chat) => (
                  <div
                    key={chat.id}
                    className="relative group/chat"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => router.push(`/search?chat_id=${chat.id}`)}
                      className="w-full justify-start h-auto py-2 px-3"
                      size="sm"
                    >
                      <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left pr-6">
                        <p className="text-xs font-medium truncate">
                          {chat.title || "Untitled Chat"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimestamp(chat.created_at)}
                        </p>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/chat:opacity-100 h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-medium">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => router.push("/connections")}
            className="w-full justify-start"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full justify-start"
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
