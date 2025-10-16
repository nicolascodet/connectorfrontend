"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback, fetchStatus, startConnect, searchOptimized, syncGmailOnce, syncGoogleDriveOnce } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Mail, LogOut, RefreshCw } from "lucide-react";

interface Status {
  tenant_id: string;
  providers: {
    outlook: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
    gmail: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
    google_drive: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingConnect, setLoadingConnect] = useState<{
    microsoft: boolean;
    gmail: boolean;
    "google-drive": boolean;
  }>({ microsoft: false, gmail: false, "google-drive": false });
  const [loadingSync, setLoadingSync] = useState<{ gmail: boolean; google_drive: boolean }>({ gmail: false, google_drive: false });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  useEffect(() => {
    async function processOAuthCallback() {
      const connectionId = searchParams.get("connectionId");
      const providerConfigKey = searchParams.get("providerConfigKey");

      if (loading) return;

      if (connectionId && providerConfigKey && user) {
        try {
          await handleOAuthCallback({ connectionId, providerConfigKey });

          if (window.opener) {
            window.opener.postMessage(
              { type: "oauth-success", provider: providerConfigKey },
              window.location.origin
            );
            setTimeout(() => window.close(), 500);
          } else {
            toast({
              title: "Connection Successful",
              description: `${providerConfigKey} connected successfully!`,
            });
            router.replace("/");
          }
        } catch (error) {
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "oauth-error",
                error: error instanceof Error ? error.message : "Failed to save connection",
              },
              window.location.origin
            );
            setTimeout(() => window.close(), 1000);
          } else {
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description: error instanceof Error ? error.message : "Failed to save connection",
            });
            router.replace("/");
          }
        }
      }
    }

    processOAuthCallback();
  }, [searchParams, router, user, loading]);

  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch status",
      });
    }
  };

  const handleConnect = async (provider: "microsoft" | "gmail" | "google-drive") => {
    setLoadingConnect((prev) => ({ ...prev, [provider]: true }));
    try {
      const result = await startConnect(provider);
      const popup = window.open(result.auth_url, "oauth", "width=600,height=700,left=100,top=100");

      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          loadStatus();
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "oauth-success") {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          toast({
            title: "Connection Successful",
            description: `${event.data.provider} connected successfully!`,
          });
          loadStatus();
          window.removeEventListener("message", messageHandler);
        } else if (event.data.type === "oauth-error") {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: event.data.error || "Failed to save connection",
          });
          window.removeEventListener("message", messageHandler);
        }
      };

      window.addEventListener("message", messageHandler);

      setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener("message", messageHandler);
        setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
      }, 300000);
    } catch (error) {
      setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Failed to connect ${provider}`,
      });
    }
  };

  const handleSyncGmail = async () => {
    setLoadingSync((prev) => ({ ...prev, gmail: true }));
    try {
      const result = await syncGmailOnce();
      await loadStatus();
      toast({
        title: "Sync Complete",
        description: result.message || "Gmail synced successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Gmail",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, gmail: false }));
    }
  };

  const handleSyncGoogleDrive = async () => {
    setLoadingSync((prev) => ({ ...prev, google_drive: true }));
    try {
      const result = await syncGoogleDriveOnce();
      await loadStatus();
      toast({
        title: "Sync Complete",
        description: result.message || "Google Drive synced successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Google Drive",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, google_drive: false }));
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingChat) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingChat(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await searchOptimized({
        query: input,
        vector_limit: 5,
        graph_limit: 5,
        conversation_history: conversationHistory,
      });

      const assistantMessage: Message = { role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search",
      });
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card rounded-3xl p-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Cortex Dashboard</h1>
              <p className="text-white/70 mt-1">Connect your data sources and search</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-white/80">{user?.email}</p>
                {status && (
                  <p className="text-xs text-white/60">Tenant: {status.tenant_id}</p>
                )}
              </div>
              <Button
                onClick={handleLogout}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Connectors */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connect Accounts */}
            <div className="glass-card rounded-3xl p-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Data Sources</h2>
                <Button
                  onClick={loadStatus}
                  size="sm"
                  className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleConnect("gmail")}
                  disabled={loadingConnect.gmail}
                  className="w-full rounded-xl py-6 glass-button text-white hover:scale-105 transition-transform"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  {loadingConnect.gmail ? "Connecting..." : "Connect Gmail"}
                </Button>
                <Button
                  onClick={() => handleConnect("google-drive")}
                  disabled={loadingConnect["google-drive"]}
                  className="w-full rounded-xl py-6 glass-button text-white hover:scale-105 transition-transform"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  {loadingConnect["google-drive"] ? "Connecting..." : "Connect Google Drive"}
                </Button>
              </div>
            </div>

            {/* Connection Status */}
            {status && (
              <div className="glass-card rounded-3xl p-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/80 text-sm">Gmail</span>
                    <span
                      className={`text-sm font-medium ${
                        status.providers.gmail.connected
                          ? "text-green-400"
                          : "text-white/50"
                      }`}
                    >
                      {status.providers.gmail.connected ? "● Connected" : "○ Not Connected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/80 text-sm">Google Drive</span>
                    <span
                      className={`text-sm font-medium ${
                        status.providers.google_drive.connected
                          ? "text-green-400"
                          : "text-white/50"
                      }`}
                    >
                      {status.providers.google_drive.connected ? "● Connected" : "○ Not Connected"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Actions */}
            {status && ((status.providers?.gmail?.connected) || (status.providers?.google_drive?.connected)) && (
              <div className="glass-card rounded-3xl p-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Manual Sync</h3>
                <div className="space-y-3">
                  {status.providers?.gmail?.connected && (
                    <Button
                      onClick={handleSyncGmail}
                      disabled={loadingSync.gmail}
                      className="w-full rounded-xl py-4 bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-400/30"
                    >
                      {loadingSync.gmail ? "Syncing..." : "Sync Gmail Once"}
                    </Button>
                  )}
                  {status.providers?.google_drive?.connected && (
                    <Button
                      onClick={handleSyncGoogleDrive}
                      disabled={loadingSync.google_drive}
                      className="w-full rounded-xl py-4 bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-400/30"
                    >
                      {loadingSync.google_drive ? "Syncing..." : "Sync Google Drive Once"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl h-[calc(100vh-200px)] flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-1">Search Your Data</h2>
                <p className="text-white/70 text-sm">Ask questions about your emails and documents</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                        <Send className="h-8 w-8 text-white/70" />
                      </div>
                      <p className="text-white/60">Start a conversation by asking a question</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-5 py-3 backdrop-blur-md ${
                            message.role === "user"
                              ? "bg-blue-500/80 text-white border border-blue-400/30"
                              : "bg-white/20 text-white border border-white/20"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {loadingChat && (
                      <div className="flex justify-start">
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20">
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={loadingChat}
                  className="flex-1 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-2xl px-6 py-6 text-base focus:bg-white/15 focus:border-white/30"
                />
                <Button
                  type="submit"
                  disabled={loadingChat || !input.trim()}
                  className="rounded-2xl px-8 bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg"
                >
                  {loadingChat ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"><Loader2 className="h-12 w-12 animate-spin text-white" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
