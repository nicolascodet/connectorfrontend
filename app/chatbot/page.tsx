"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, Mail, FileText, HardDrive, File, ExternalLink, X } from "lucide-react";

// Source type definitions
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

interface SourceDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  document_type: string;
  source_id: string;
  created_at: string;
  metadata: any;
  raw_data: any;
}

// App logo/icon mapping
const getAppIcon = (source: string, documentType: string) => {
  const sourceKey = source?.toLowerCase() || '';
  const typeKey = documentType?.toLowerCase() || '';

  // Gmail
  if (sourceKey === 'gmail' || typeKey === 'email') {
    return <Mail className="h-4 w-4" />;
  }

  // Google Drive / Documents
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') {
    return <HardDrive className="h-4 w-4" />;
  }

  // Outlook
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') {
    return <Mail className="h-4 w-4" />;
  }

  // Files
  if (typeKey === 'pdf' || typeKey === 'doc' || typeKey === 'docx') {
    return <FileText className="h-4 w-4" />;
  }

  // Default
  return <File className="h-4 w-4" />;
};

// App color mapping
const getAppColor = (source: string) => {
  const sourceKey = source?.toLowerCase() || '';

  if (sourceKey === 'gmail') return 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'bg-blue-500/20 text-blue-300 border-blue-400/30 hover:bg-blue-500/30';
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30';

  return 'bg-gray-500/20 text-gray-300 border-gray-400/30 hover:bg-gray-500/30';
};

// App display name
const getAppName = (source: string) => {
  const sourceKey = source?.toLowerCase() || '';

  if (sourceKey === 'gmail') return 'Gmail';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'Outlook';
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'Google Drive';
  if (sourceKey === 'upload') return 'Upload';

  return source || 'Unknown';
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceDocument | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSourceDocument = async (documentId: string) => {
    setLoadingSource(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/sources/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch source');

      const data = await response.json();
      setSelectedSource(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load source",
        description: error instanceof Error ? error.message : "Could not load source document",
      });
    } finally {
      setLoadingSource(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          question: input,
          chat_id: chatId,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const result = await response.json();

      // Update chat ID if this is first message
      if (!chatId && result.chat_id) {
        setChatId(result.chat_id);
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
      setLoading(false);
    }
  };

  // Group sources by app
  const groupSourcesByApp = (sources: Source[]) => {
    const grouped: Record<string, Source[]> = {};

    sources.forEach(source => {
      const key = source.source || 'unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(source);
    });

    return grouped;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-5xl mx-auto h-[90vh] flex flex-col">
        <div className="glass-card rounded-3xl p-8 flex-1 flex flex-col backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Search Your Data</h1>
            <p className="text-white/70">Ask questions about your emails and documents</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                    <Send className="h-8 w-8 text-white/70" />
                  </div>
                  <p className="text-white/60 text-lg">Start a conversation by asking a question</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-6 py-3 backdrop-blur-md ${
                        message.role === "user"
                          ? "bg-blue-500/80 text-white border border-blue-400/30"
                          : "bg-white/20 text-white border border-white/20"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* Sources Section */}
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 max-w-[80%]">
                        {Object.entries(groupSourcesByApp(message.sources)).map(([appSource, sources]) => (
                          <button
                            key={appSource}
                            onClick={() => {
                              if (sources[0].document_id) {
                                fetchSourceDocument(sources[0].document_id);
                              }
                            }}
                            disabled={!sources[0].document_id}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border transition-all ${getAppColor(appSource)} ${!sources[0].document_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {getAppIcon(appSource, sources[0].document_type)}
                            <span className="text-xs font-medium">{getAppName(appSource)}</span>
                            {sources.length > 1 && (
                              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                                +{sources.length - 1}
                              </span>
                            )}
                            {sources[0].document_id && (
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-2xl px-6 py-6 text-base focus:bg-white/15 focus:border-white/30"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-2xl px-8 bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Source Detail Modal */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedSource(null)}>
          <div className="bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getAppIcon(selectedSource.source, selectedSource.document_type)}
                  <h2 className="text-2xl font-bold text-white">{selectedSource.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    {getAppIcon(selectedSource.source, selectedSource.document_type)}
                    {getAppName(selectedSource.source)}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedSource.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedSource.document_type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="prose prose-invert max-w-none">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {selectedSource.content}
                  </p>
                </div>

                {/* Metadata */}
                {selectedSource.metadata && Object.keys(selectedSource.metadata).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Metadata</h3>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(selectedSource.metadata).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-white/60 font-medium capitalize">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-white/90">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Source Overlay */}
      {loadingSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      )}
    </main>
  );
}
