"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback, searchOptimized, uploadFile, getChatMessages, getSourceDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, FileText, Lightbulb, Calendar, PenTool, Plus, Upload, Mail, HardDrive, File } from "lucide-react";
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

interface Source {
  index: number;
  document_id: string | null;
  document_name: string;
  source: string;
  document_type: string;
  timestamp: string;
  text_preview: string;
  score?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

// Helper functions for source display
const getAppIcon = (source: string) => {
  const sourceKey = source?.toLowerCase() || '';
  if (sourceKey === 'gmail') return <Mail className="h-3 w-3" />;
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return <Mail className="h-3 w-3" />;
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return <HardDrive className="h-3 w-3" />;
  return <File className="h-3 w-3" />;
};

const getAppColor = (source: string) => {
  const sourceKey = source?.toLowerCase() || '';
  if (sourceKey === 'gmail') return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
  return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
};

const getAppName = (source: string) => {
  const sourceKey = source?.toLowerCase() || '';
  if (sourceKey === 'gmail') return 'Gmail';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'Outlook';
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'Google Drive';
  if (sourceKey === 'upload') return 'Upload';
  return source || 'Unknown';
};

const groupSourcesByApp = (sources: Source[]) => {
  const grouped: Record<string, Source[]> = {};
  sources.forEach(source => {
    const key = source.source || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(source);
  });
  return grouped;
};

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Also scroll when loading state changes (for better UX when chat finishes)
    if (!loadingChat) {
      scrollToBottom();
    }
  }, [loadingChat]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load existing chat messages if chat_id is in URL
  useEffect(() => {
    const chatId = searchParams.get("chat_id");
    if (chatId && user && !loading) {
      loadChatMessages(chatId);
    }
  }, [searchParams, user, loading]);

  const loadChatMessages = async (chatId: string) => {
    try {
      console.log(`📖 Loading chat messages for chat_id: ${chatId}`);
      const result = await getChatMessages(chatId);
      
      // Convert backend message format to frontend format
      const formattedMessages: Message[] = result.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        sources: msg.role === 'assistant' ? (msg.sources || []) : undefined
      }));
      
      setMessages(formattedMessages);
      console.log(`✅ Loaded ${formattedMessages.length} messages`);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      toast({
        variant: "destructive",
        title: "Failed to load chat",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleSourceClick = async (source: Source) => {
    try {
      if (!source.document_id || source.document_id === 'None' || source.document_id === 'null' || source.document_id === null) {
        toast({
          variant: "destructive",
          title: "Document not available",
          description: "This source doesn't have a document ID",
        });
        return;
      }

      console.log(`📄 Loading source document: ${source.document_id}`);
      const document = await getSourceDocument(source.document_id);
      setSelectedSource(document);
      setSourceModalOpen(true);
    } catch (error) {
      console.error("Failed to load source document:", error);
      toast({
        variant: "destructive",
        title: "Failed to load document",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

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


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const userMessage: Message = { role: "user", content: `📎 Uploaded: ${file.name}` };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call real upload API
      const result = await uploadFile(file);

      toast({
        title: "File Uploaded",
        description: result.message,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: `✅ ${result.message} You can now ask me questions about it!`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't process that file. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingChat) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingChat(true);

    try {
      // Use chat API to get sources
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          question: input,
          chat_id: searchParams.get("chat_id"),
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const result = await response.json();

      console.log('📊 Sources received:', result.sources);

      // If this was a new chat, update URL with the chat_id
      const currentChatId = searchParams.get("chat_id");
      if (!currentChatId && result.chat_id) {
        const url = new URL(window.location.href);
        url.searchParams.set("chat_id", result.chat_id);
        window.history.replaceState({}, '', url.toString());
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: result.answer,
        sources: result.sources || [],
      };
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

                {/* Add file upload */}
                <div className="flex items-center gap-3 mt-4 justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-3 rounded-full hover:bg-white/60 transition-colors disabled:opacity-50"
                    title="Upload file"
                  >
                    {uploadingFile ? (
                      <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-600" />
                    )}
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
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-6 mb-6 px-4 scroll-smooth">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
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

                    {/* Source Bubbles */}
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 max-w-[75%]">
                        {message.sources.slice(0, 8).map((source, sourceIndex) => {
                          const hasDocument = source.document_id && source.document_id !== 'None' && source.document_id !== 'null' && source.document_id !== null;
                          return (
                            <button
                              key={sourceIndex}
                              onClick={() => handleSourceClick(source)}
                              disabled={!hasDocument}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                hasDocument 
                                  ? `cursor-pointer hover:scale-105 ${getAppColor(source.source)}` 
                                  : `cursor-not-allowed opacity-60 ${getAppColor(source.source)}`
                              }`}
                              title={hasDocument ? `Click to view: ${source.document_name || 'Document'}` : 'Document not available'}
                            >
                              {getAppIcon(source.source)}
                              <span className="truncate max-w-[120px]">
                                {source.document_name || getAppName(source.source) || 'Unknown'}
                              </span>
                              {!hasDocument && (
                                <span className="text-[10px] opacity-50">📋</span>
                              )}
                            </button>
                          );
                        })}
                        {message.sources.length > 8 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                            <span>+{message.sources.length - 8} more</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl px-6 py-4 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        <span className="text-sm text-gray-600">Loading...</span>
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

      {/* Source Document Modal */}
      {sourceModalOpen && selectedSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getAppIcon(selectedSource.source)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedSource.title || selectedSource.metadata?.title || 'Document'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {getAppName(selectedSource.source)} • {new Date(selectedSource.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSourceModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {selectedSource.content || 'No content available'}
                  </pre>
                </div>
                
                {/* Metadata */}
                {selectedSource.metadata && Object.keys(selectedSource.metadata).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border text-xs">
                      <pre className="text-gray-600">
                        {JSON.stringify(selectedSource.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
