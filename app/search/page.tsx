"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendChatMessage, getChatMessages, getSourceDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Sidebar from "@/components/sidebar";
import { Send, Loader2, Mail, HardDrive, File, Sheet, Presentation, FileImage, Database, MessageSquare, Building2, DollarSign, FileText, ExternalLink, Sparkles, ChevronDown, ChevronRight, Download, X } from "lucide-react";
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
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadingTexts = [
    "Searching",
    "Analyzing",
    "Processing",
    "Finding",
    "Reviewing",
    "Examining",
    "Scanning",
    "Investigating",
    "Coalescing",
    "Manifesting",
    "Brewing",
    "Synthesizing",
    "Aggregating",
    "Compiling",
    "Orchestrating",
    "Curating",
    "Assembling",
    "Materializing",
    "Conjuring",
    "Foraging",
    "Mining",
    "Excavating",
    "Harvesting",
    "Distilling",
    "Weaving",
    "Crafting",
    "Summoning",
    "Channeling",
    "Divining",
    "Contemplating",
  ];

  // Cycle through loading texts
  useEffect(() => {
    if (loadingChat) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setLoadingTextIndex(0);
    }
  }, [loadingChat]);

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
      const result = await sendChatMessage(searchQuery, searchParams.get("chat_id") || undefined);

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
    <div className="flex h-full">
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ paddingBottom: messages.length > 0 ? 'calc(120px + 5vh)' : '24px' }}>
          <div className={`max-w-5xl mx-auto space-y-4 ${messages.length > 0 ? 'pt-20' : ''}`}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] pt-[10vh]">
                <h2 className="text-2xl font-normal text-gray-900 mb-3">Ask me anything, {user?.email?.split('@')[0] || 'there'}</h2>
                <p className="text-gray-600 text-center max-w-md mb-8 text-base font-light">
                  Search across all your connected documents, emails, and data sources
                </p>

                {/* Search Bar */}
                <div className="w-full max-w-5xl mb-8 px-4">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-gray-800/10 to-black/10 rounded-2xl blur-xl"></div>
                      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-300">
                        <div className="flex items-end gap-3 p-4">
                          <textarea
                            value={input}
                            onChange={(e) => {
                              setInput(e.target.value);
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSearch();
                              }
                            }}
                            placeholder="What can I help you with?"
                            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-sm resize-none max-h-[400px] overflow-y-auto leading-tight"
                            disabled={loadingChat}
                            rows={1}
                            style={{ height: '20px', lineHeight: '20px' }}
                          />
                          <button
                            type="submit"
                            disabled={!input.trim() || loadingChat}
                            className="w-10 h-10 flex-shrink-0 rounded-xl bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Suggestion chips */}
                <div className={`flex flex-wrap gap-3 justify-center max-w-2xl transition-opacity duration-500 ${input.trim() ? 'opacity-0' : 'opacity-100'}`}>
                  <button
                    onClick={() => setInput("Summarize recent business emails")}
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)' }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Recent business emails
                  </button>
                  <button
                    onClick={() => setInput("Show me financial documents")}
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)' }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Financial docs
                  </button>
                  <button
                    onClick={() => setInput("What meetings do I have this week?")}
                    style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 20px rgba(255, 255, 255, 0.8)' }}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    This week's meetings
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, idx) => (
              <div key={idx} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                {message.role === "user" ? (
                  <div className="bg-black text-white rounded-3xl px-6 py-4">
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="prose prose-sm max-w-none">
                        <SmartMarkdown content={message.content} />
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedSources);
                              if (newExpanded.has(idx)) {
                                newExpanded.delete(idx);
                              } else {
                                newExpanded.add(idx);
                              }
                              setExpandedSources(newExpanded);
                            }}
                            className="w-full flex items-center justify-between mb-3 hover:opacity-70 transition-opacity"
                          >
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Sources ({message.sources.length})
                            </p>
                            {expandedSources.has(idx) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </button>

                          {/* Show first 2 sources always, rest when expanded */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5">
                            {message.sources.slice(0, expandedSources.has(idx) ? message.sources.length : 2).map((source, sourceIdx) => {
                              const isClickable = source.file_url || source.document_id;
                              const handleClick = async () => {
                                if (source.file_url) {
                                  setPreviewUrl(source.file_url);
                                } else if (source.document_id) {
                                  setLoadingDocument(true);
                                  try {
                                    const doc = await getSourceDocument(source.document_id);
                                    setSelectedDocument(doc);
                                  } catch (error) {
                                    console.error('Failed to load document:', error);
                                    toast({
                                      variant: "destructive",
                                      title: "Failed to load document",
                                      description: "Could not fetch document content"
                                    });
                                  } finally {
                                    setLoadingDocument(false);
                                  }
                                }
                              };

                              return (
                                <div
                                  key={sourceIdx}
                                  onClick={isClickable ? handleClick : undefined}
                                  className={`bg-gray-50 rounded-lg p-2 transition-colors border border-gray-100 ${
                                    isClickable ? 'hover:bg-gray-100 cursor-pointer hover:border-blue-200' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <div className="mt-0.5 flex-shrink-0">
                                      {getDocumentIcon(source)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate mb-0.5">
                                        {source.document_name}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {getDocumentTypeName(source)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Show "View more" hint if collapsed and has more than 2 */}
                          {!expandedSources.has(idx) && message.sources.length > 2 && (
                            <div className="mt-3 text-center">
                              <span className="text-xs text-gray-400">
                                +{message.sources.length - 2} more sources
                              </span>
                            </div>
                          )}
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
                    <span className="text-sm text-gray-600">{loadingTexts[loadingTextIndex]}...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom (only show when there are messages) */}
        {messages.length > 0 && (
        <div className="fixed bottom-6 left-64 right-0 flex justify-center px-4 z-50 pointer-events-none">
          <div className="w-full max-w-5xl pointer-events-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-gray-800/10 to-black/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-300">
                  <div className="flex items-end gap-3 p-4">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 400) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      placeholder="Ask a question..."
                      className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-sm resize-none max-h-[400px] overflow-y-auto leading-tight"
                      disabled={loadingChat}
                      rows={1}
                      style={{ height: '20px', lineHeight: '20px' }}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loadingChat}
                      className="w-10 h-10 flex-shrink-0 rounded-xl bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-3xl w-[70vw] h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50 p-8">
              <div className="w-full h-full flex items-center justify-center">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-2xl border border-gray-200 bg-white shadow-lg"
                  title="Document Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Content Modal (for emails/text documents) */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDocument(null)}>
          <div className="bg-white rounded-3xl w-[70vw] h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex-1 mr-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{selectedDocument.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize">{selectedDocument.source}</span>
                  {selectedDocument.sender_name && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedDocument.sender_name}
                    </span>
                  )}
                  {selectedDocument.created_at && (
                    <span>{new Date(selectedDocument.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 max-w-4xl mx-auto">
                {selectedDocument.metadata?.subject && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Subject</div>
                    <div className="font-semibold text-gray-900">{selectedDocument.metadata.subject}</div>
                  </div>
                )}

                {selectedDocument.sender_address && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">From</div>
                    <div className="text-gray-900">
                      {selectedDocument.sender_name ? (
                        <span>{selectedDocument.sender_name} &lt;{selectedDocument.sender_address}&gt;</span>
                      ) : (
                        <span>{selectedDocument.sender_address}</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedDocument.to_addresses && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</div>
                    <div className="text-gray-900">
                      {Array.isArray(selectedDocument.to_addresses)
                        ? selectedDocument.to_addresses.join(', ')
                        : selectedDocument.to_addresses}
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <SmartMarkdown content={selectedDocument.content || 'No content available'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loadingDocument && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Loading document...</span>
          </div>
        </div>
      )}
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
