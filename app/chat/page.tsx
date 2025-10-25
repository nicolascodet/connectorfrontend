"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback, searchOptimized, uploadFile, getChatMessages, getSourceDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, FileText, Lightbulb, Calendar, PenTool, Plus, Upload, Mail, HardDrive, File, Sheet, Presentation, FileImage, Database, MessageSquare, Building2, DollarSign, Settings, Link as LinkIcon } from "lucide-react";
import SmartMarkdown from '@/components/SmartMarkdown';
import Link from 'next/link';

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
  file_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

// Helper functions for source display - Enhanced for all document types
const getDocumentIcon = (source: Source) => {
  const sourceKey = source?.source?.toLowerCase() || '';
  const docType = source?.document_type?.toLowerCase() || '';
  const docName = source?.document_name?.toLowerCase() || '';

  // Email sources
  if (sourceKey === 'gmail') return <Mail className="h-3 w-3 text-red-600" />;
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return <Mail className="h-3 w-3 text-blue-600" />;
  
  // Google Workspace - detect by document name patterns or MIME types
  if (docName.includes('google docs') || docName.includes('.docx') || docType === 'document') {
    return <FileText className="h-3 w-3 text-blue-600" />;
  }
  if (docName.includes('google sheets') || docName.includes('.xlsx') || docType === 'spreadsheet') {
    return <Sheet className="h-3 w-3 text-green-600" />;
  }
  if (docName.includes('google slides') || docName.includes('.pptx') || docType === 'presentation') {
    return <Presentation className="h-3 w-3 text-orange-600" />;
  }
  
  // Document types by extension/content
  if (docName.includes('.pdf') || docType === 'pdf') return <FileText className="h-3 w-3 text-red-600" />;
  if (docName.includes('.jpg') || docName.includes('.png') || docType === 'image') return <FileImage className="h-3 w-3 text-purple-600" />;
  
  // Business platforms
  if (sourceKey === 'hubspot') return <Building2 className="h-3 w-3 text-orange-600" />;
  if (sourceKey === 'salesforce') return <Database className="h-3 w-3 text-blue-600" />;
  if (sourceKey === 'quickbooks') return <DollarSign className="h-3 w-3 text-green-600" />;
  if (sourceKey === 'slack') return <MessageSquare className="h-3 w-3 text-purple-600" />;
  
  // Google Drive (generic)
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') {
    return <HardDrive className="h-3 w-3 text-green-600" />;
  }
  
  // Upload
  if (sourceKey === 'upload') return <Upload className="h-3 w-3 text-gray-600" />;
  
  // Default
  return <File className="h-3 w-3 text-gray-600" />;
};

const getDocumentColor = (source: Source) => {
  const sourceKey = source?.source?.toLowerCase() || '';
  const docType = source?.document_type?.toLowerCase() || '';
  const docName = source?.document_name?.toLowerCase() || '';

  // Email sources
  if (sourceKey === 'gmail') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  
  // Google Workspace
  if (docName.includes('google docs') || docName.includes('.docx') || docType === 'document') {
    return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  }
  if (docName.includes('google sheets') || docName.includes('.xlsx') || docType === 'spreadsheet') {
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
  }
  if (docName.includes('google slides') || docName.includes('.pptx') || docType === 'presentation') {
    return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
  }
  
  // Document types
  if (docName.includes('.pdf') || docType === 'pdf') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
  if (docName.includes('.jpg') || docName.includes('.png') || docType === 'image') return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  
  // Business platforms  
  if (sourceKey === 'hubspot') return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
  if (sourceKey === 'salesforce') return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  if (sourceKey === 'quickbooks') return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
  if (sourceKey === 'slack') return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  
  // Google Drive (generic)
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') {
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
  }
  
  // Upload
  if (sourceKey === 'upload') return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
  
  // Default
  return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
};

const getDocumentTypeName = (source: Source) => {
  const sourceKey = source?.source?.toLowerCase() || '';
  const docType = source?.document_type?.toLowerCase() || '';
  const docName = source?.document_name?.toLowerCase() || '';

  // Email sources
  if (sourceKey === 'gmail') return 'Gmail';
  if (sourceKey === 'outlook' || sourceKey === 'microsoft') return 'Outlook';
  
  // Google Workspace - be specific!
  if (docName.includes('google docs') || docType === 'document') return 'Google Docs';
  if (docName.includes('google sheets') || docType === 'spreadsheet') return 'Google Sheets';  
  if (docName.includes('google slides') || docType === 'presentation') return 'Google Slides';
  
  // Document types
  if (docName.includes('.pdf') || docType === 'pdf') return 'PDF';
  if (docName.includes('.docx')) return 'Word Doc';
  if (docName.includes('.xlsx')) return 'Excel';
  if (docName.includes('.pptx')) return 'PowerPoint';
  if (docName.includes('.jpg') || docName.includes('.png') || docType === 'image') return 'Image';
  
  // Business platforms
  if (sourceKey === 'hubspot') return 'HubSpot';
  if (sourceKey === 'salesforce') return 'Salesforce';
  if (sourceKey === 'quickbooks') return 'QuickBooks';
  if (sourceKey === 'slack') return 'Slack';
  
  // Generic Google Drive
  if (sourceKey === 'gdrive' || sourceKey === 'google_drive' || sourceKey === 'drive') return 'Google Drive';
  if (sourceKey === 'upload') return 'Upload';
  
  // Fallback to source name
  return source?.source || 'Unknown';
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
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
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
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          CORTEX
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/connections">
            <Button variant="ghost" size="sm" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Connections
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-20">
        <div className="w-full max-w-4xl flex flex-col h-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              {/* Greeting */}
              <div className="text-center space-y-3">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                  Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
                </h1>
                <p className="text-2xl text-gray-600">What can I help you with?</p>
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
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                {suggestionChips.map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={i}
                      onClick={chip.action}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white backdrop-blur-sm rounded-full transition-all hover:scale-105 border border-gray-200/50 shadow-sm hover:shadow-md"
                    >
                      <Icon className="h-4 w-4 text-purple-600" />
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
                      {message.role === "user" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <SmartMarkdown content={message.content} />
                      )}
                    </div>

                    {/* Source Bubbles - Enhanced with All Document Types */}
                    {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 max-w-[75%]">
                        {(() => {
                          // Deduplicate sources by document_id
                          const uniqueSources = Array.from(
                            new Map(
                              message.sources
                                .filter(s => s.document_id && s.document_id !== 'None' && s.document_id !== 'null' && s.document_id !== null)
                                .map(s => [s.document_id, s])
                            ).values()
                          );

                          const isExpanded = expandedSources.has(index);
                          const sourcesToShow = isExpanded ? uniqueSources : uniqueSources.slice(0, 8);
                          const remainingCount = uniqueSources.length - 8;

                          return (
                            <>
                              {sourcesToShow.map((source, sourceIndex) => {
                                const hasDocument = source.document_id && source.document_id !== 'None' && source.document_id !== 'null' && source.document_id !== null;
                                return (
                                  <button
                                    key={source.document_id || sourceIndex}
                                    onClick={() => handleSourceClick(source)}
                                    disabled={!hasDocument}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                      hasDocument
                                        ? `cursor-pointer hover:scale-105 ${getDocumentColor(source)}`
                                        : `cursor-not-allowed opacity-60 ${getDocumentColor(source)}`
                                    }`}
                                    title={hasDocument ? `Click to view: ${source.document_name || 'Document'}` : 'Document not available'}
                                  >
                                    {getDocumentIcon(source)}
                                    <span className="truncate max-w-[120px]">
                                      {source.document_name || getDocumentTypeName(source)}
                                    </span>
                                    {!hasDocument && (
                                      <span className="text-[10px] opacity-50">📋</span>
                                    )}
                                  </button>
                                );
                              })}
                              
                              {/* Expandable "+X more" button */}
                              {uniqueSources.length > 8 && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedSources);
                                    if (isExpanded) {
                                      newExpanded.delete(index);
                                    } else {
                                      newExpanded.add(index);
                                    }
                                    setExpandedSources(newExpanded);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 cursor-pointer transition-all hover:scale-105"
                                  title={isExpanded ? 'Show fewer sources' : `Show all ${uniqueSources.length} sources`}
                                >
                                  {isExpanded ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                      <span>Show less</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>+{remainingCount} more</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm rounded-3xl px-6 py-4 border border-purple-200/50 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          Thinking...
                        </span>
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

      {/* Source Document Modal - FIRE EDITION */}
      {sourceModalOpen && selectedSource && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSourceModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Gradient */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {getDocumentIcon(selectedSource)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 truncate max-w-xl">
                    {selectedSource.title || selectedSource.metadata?.title || 'Document'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white/80 text-xs font-medium text-gray-700 rounded-full border border-gray-200">
                      {getDocumentTypeName(selectedSource)}
                    </span>
                    <span className="text-xs text-gray-500">
                      • {new Date(selectedSource.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSourceModalOpen(false)}
                className="p-2 hover:bg-white/80 rounded-xl transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[65vh] space-y-6">
              {/* File Preview Section - UPGRADED */}
              {selectedSource.file_url && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <h3 className="text-base font-bold text-gray-900">Original File</h3>
                    </div>
                    <a
                      href={selectedSource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all hover:scale-105"
                    >
                      <span>Open in new tab</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Image Preview - ENHANCED */}
                  {selectedSource.mime_type?.startsWith('image/') && (
                    <div className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                      <img
                        src={selectedSource.file_url}
                        alt={selectedSource.title || 'Document preview'}
                        className="w-full h-auto max-h-[500px] object-contain p-4"
                      />
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-lg">Click to zoom</span>
                      </div>
                    </div>
                  )}

                  {/* PDF Preview - ENHANCED */}
                  {selectedSource.mime_type === 'application/pdf' && (
                    <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                      <iframe
                        src={selectedSource.file_url}
                        className="w-full h-[500px]"
                        title="PDF Preview"
                      />
                    </div>
                  )}

                  {/* Generic File Link - ENHANCED */}
                  {!selectedSource.mime_type?.startsWith('image/') && selectedSource.mime_type !== 'application/pdf' && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 flex items-center gap-4 shadow-md hover:shadow-lg transition-shadow">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <FileText className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{selectedSource.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedSource.mime_type}</p>
                      </div>
                      <a
                        href={selectedSource.file_url}
                        download
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text Section - UPGRADED */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  <h3 className="text-base font-bold text-gray-900">
                    Extracted Text
                    {selectedSource.metadata?.ocr_enabled && (
                      <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                        ✨ AI OCR
                      </span>
                    )}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-inner">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {selectedSource.content || 'No content available'}
                  </pre>
                </div>
              </div>

              {/* Metadata - Collapsible & Styled */}
              {selectedSource.metadata && Object.keys(selectedSource.metadata).length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none">
                    <div className="w-1 h-6 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full"></div>
                    <h3 className="text-base font-bold text-gray-900">Technical Metadata</h3>
                    <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-3 bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg">
                    <pre className="text-xs text-green-400 font-mono leading-relaxed overflow-x-auto">
                      {JSON.stringify(selectedSource.metadata, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
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
