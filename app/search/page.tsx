"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchOptimized, getChatMessages } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Send, Loader2, Mail, HardDrive, File, Sheet, Presentation, FileImage, Database, MessageSquare, Building2, DollarSign, FileText, ExternalLink, Sparkles } from "lucide-react";
import SmartMarkdown from '@/components/SmartMarkdown';

interface Source {
  index: number;
  document_id: string | null;
  document_name: string;
  source: string;
  document_type: string;
  timestamp: string;
  text_preview: string;
  score?: number;
  file_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  parent_document_id?: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

// Helper functions
const getDocumentIcon = (source: Source) => {
  const sourceKey = source?.source?.toLowerCase() || '';
  const docType = source?.document_type?.toLowerCase() || '';
  const docName = source?.document_name?.toLowerCase() || '';

  if (sourceKey === 'gmail') return <Mail className="h-4 w-4 text-red-600" />;
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return <Mail className="h-4 w-4 text-blue-600" />;
  if (docName.includes('google docs') || docName.includes('.docx') || docType === 'document') return <FileText className="h-4 w-4 text-blue-600" />;
  if (docName.includes('google sheets') || docName.includes('.xlsx') || docType === 'spreadsheet') return <Sheet className="h-4 w-4 text-green-600" />;
  if (docName.includes('google slides') || docName.includes('.pptx') || docType === 'presentation') return <Presentation className="h-4 w-4 text-orange-600" />;
  if (docName.includes('.pdf') || docType === 'pdf') return <FileText className="h-4 w-4 text-red-600" />;
  if (sourceKey === 'quickbooks') return <DollarSign className="h-4 w-4 text-green-600" />;
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return <HardDrive className="h-4 w-4 text-green-600" />;

  return <File className="h-4 w-4 text-gray-600" />;
};

const getDocumentTypeName = (source: Source) => {
  const sourceKey = source?.source?.toLowerCase() || '';
  if (sourceKey === 'gmail') return 'Gmail';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'Outlook';
  if (sourceKey === 'quickbooks') return 'QuickBooks';
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'Google Drive';
  return 'Document';
};

function SearchPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Check for query parameter from dashboard
  useEffect(() => {
    const query = searchParams.get("q");
    if (query && messages.length === 0) {
      setInput(query);
      // Auto-submit the query
      setTimeout(() => {
        handleSearch(query);
      }, 100);
    }
  }, [searchParams]);

  // Load existing chat if chat_id is present
  useEffect(() => {
    const chatId = searchParams.get("chat_id");
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId);
      loadChatMessages(chatId);
    }
  }, [searchParams]);

  const loadChatMessages = async (chatId: string) => {
    try {
      const result = await getChatMessages(chatId);
      setMessages(result.messages);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async (queryText?: string) => {
    const searchQuery = queryText || input;
    if (!searchQuery.trim()) return;

    const userMessage: Message = { role: "user", content: searchQuery };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingChat(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          question: searchQuery,
          chat_id: searchParams.get("chat_id"),
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');
      const result = await response.json();

      const currentChatIdParam = searchParams.get("chat_id");
      if (!currentChatIdParam && result.chat_id) {
        setCurrentChatId(result.chat_id);
        const url = new URL(window.location.href);
        url.searchParams.set("chat_id", result.chat_id);
        window.history.replaceState({}, '', url.toString());
      }

      if (result.answer && result.answer.trim()) {
        const assistantMessage: Message = {
          role: "assistant",
          content: result.answer,
          sources: result.sources || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search",
      });
    } finally {
      setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Search</h1>
            <p className="text-sm text-gray-600">Ask questions about your documents and data</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ask me anything</h2>
                <p className="text-gray-600 text-center max-w-md mb-8">
                  Search across all your connected documents, emails, and data sources
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                  <button
                    onClick={() => setInput("What data sources do we have connected?")}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Connected sources
                  </button>
                  <button
                    onClick={() => setInput("Summarize recent important emails")}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Recent emails
                  </button>
                  <button
                    onClick={() => setInput("Show me financial documents")}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Financial docs
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, idx) => (
              <div key={idx} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {message.role === "user" ? (
                  <div className="bg-blue-500 text-white rounded-3xl px-6 py-4 max-w-2xl">
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-3xl border border-gray-200 p-8">
                      <div className="prose prose-sm max-w-none">
                        <SmartMarkdown content={message.content} />
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                            Sources ({message.sources.length})
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {message.sources.map((source, sourceIdx) => (
                              <div
                                key={sourceIdx}
                                className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {getDocumentIcon(source)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                      {source.document_name}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {getDocumentTypeName(source)} • {new Date(source.timestamp).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {source.text_preview}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loadingChat && (
              <div className="flex justify-start">
                <div className="bg-white rounded-3xl border border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Searching...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="bg-white border-t border-gray-200 px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-6 py-4 pr-14 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loadingChat}
              />
              <button
                type="submit"
                disabled={!input.trim() || loadingChat}
                className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
