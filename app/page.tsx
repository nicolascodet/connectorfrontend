"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback, searchOptimized } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, FileText, Lightbulb, Calendar, PenTool, Plus } from "lucide-react";
import Sidebar from "@/components/sidebar";

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
    google_drive?: {
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
  const { user, loading } = useAuth();
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
            router.push("/connections");
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
            router.push("/connections");
          }
        }
      }
    }

    processOAuthCallback();
  }, [searchParams, router, user, loading]);


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
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const suggestionChips = [
    { icon: Sparkles, label: "Create image", action: () => setInput("Create an image of ") },
    { icon: FileText, label: "Summarize text", action: () => setInput("Summarize this: ") },
    { icon: Lightbulb, label: "Brainstorm ideas", action: () => setInput("Help me brainstorm ideas for ") },
    { icon: Calendar, label: "Make a plan", action: () => setInput("Create a plan for ") },
    { icon: PenTool, label: "Help me write", action: () => setInput("Help me write ") },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl flex flex-col h-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              {/* Gradient Orb */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 shadow-2xl flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 opacity-90" />
              </div>

              {/* Greeting */}
              <div className="text-center space-y-2">
                <h1 className="text-5xl font-bold text-gray-900">
                  Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}, {user?.email?.split("@")[0] || "User"}
                </h1>
                <p className="text-xl text-gray-600">How can I help you today?</p>
              </div>

              {/* Input */}
              <form onSubmit={handleChatSubmit} className="w-full">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    disabled={loadingChat}
                    className="w-full bg-white/80 backdrop-blur-sm border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-3xl px-6 py-8 text-lg pr-16 shadow-lg focus:ring-2 focus:ring-purple-400"
                  />
                  <Button
                    type="submit"
                    disabled={loadingChat || !input.trim()}
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0"
                  >
                    {loadingChat ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Send className="h-5 w-5 text-white" />
                    )}
                  </Button>
                </div>

                {/* Add + and mic icons */}
                <div className="flex items-center gap-3 mt-4 justify-center">
                  <button type="button" className="p-3 rounded-full hover:bg-white/60 transition-colors">
                    <Plus className="h-5 w-5 text-gray-600" />
                  </button>
                  <button type="button" className="p-3 rounded-full hover:bg-white/60 transition-colors">
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <select className="px-4 py-2 rounded-xl bg-white/60 text-sm text-gray-700 border-0 hover:bg-white/80 transition-colors">
                    <option>Data Source</option>
                  </select>
                </div>
              </form>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-3 justify-center">
                {suggestionChips.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={i}
                      onClick={chip.action}
                      className="flex items-center gap-2 px-5 py-3 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl transition-all hover:scale-105 border border-gray-200/50"
                    >
                      <Icon className="h-4 w-4 text-gray-700" />
                      <span className="text-sm text-gray-700 font-medium">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-3xl px-6 py-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                          : "bg-white/70 backdrop-blur-sm text-gray-900 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl px-6 py-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        <span className="text-sm text-gray-600">Creating CSV file, please wait...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleChatSubmit} className="px-4">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    disabled={loadingChat}
                    className="w-full bg-white/80 backdrop-blur-sm border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-3xl px-6 py-6 text-base pr-16 shadow-lg"
                  />
                  <Button
                    type="submit"
                    disabled={loadingChat || !input.trim()}
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0"
                  >
                    {loadingChat ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Send className="h-4 w-4 text-white" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
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
