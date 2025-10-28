"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback, searchOptimized, uploadFile, getChatMessages, getSourceDocument } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, FileText, Lightbulb, Calendar, PenTool, Plus, Upload, Mail, HardDrive, File, Sheet, Presentation, FileImage, Database, MessageSquare, Building2, DollarSign, Settings, Link as LinkIcon, Paperclip, ExternalLink } from "lucide-react";
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
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null); // NEW: For viewing attachments in-modal
  const [sourcesListOpen, setSourcesListOpen] = useState<number | null>(null); // Track which message's sources are open
  const [thinkingStep, setThinkingStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic thinking messages
  const thinkingMessages = [
    { icon: "🔍", text: "Searching knowledge base..." },
    { icon: "📊", text: "Analyzing documents..." },
    { icon: "🧠", text: "Processing information..." },
    { icon: "🔗", text: "Connecting insights..." },
    { icon: "✨", text: "Synthesizing response..." },
  ];

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

  // Cycle through thinking messages while loading
  useEffect(() => {
    if (loadingChat) {
      setThinkingStep(0);
      const interval = setInterval(() => {
        setThinkingStep((prev) => (prev + 1) % thinkingMessages.length);
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(interval);
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

      // If source has a file_url, open it directly in a new tab (for PDFs, attachments, etc.)
      if (source.file_url) {
        console.log(`🔗 Opening file URL: ${source.file_url}`);
        window.open(source.file_url, '_blank');
        return;
      }

      // Otherwise, fetch and show the document in a modal (for emails, text documents, etc.)
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
                        <div className="relative">
                          <SmartMarkdown
                            content={message.content}
                            sources={message.sources}
                            onSourceClick={handleSourceClick}
                          />

                          {/* Inline Source Citations - Next to text like ChatGPT */}
                          {message.sources && message.sources.length > 0 && (
                            <>
                              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                {(() => {
                                  // Deduplicate sources by document_id
                                  const uniqueSources = Array.from(
                                    new Map(
                                      message.sources
                                        .filter(s => s.document_id && s.document_id !== 'None' && s.document_id !== 'null' && s.document_id !== null)
                                        .map(s => [s.document_id, s])
                                    ).values()
                                  );

                                  return (
                                    <>
                                      {uniqueSources.slice(0, 3).map((source, sourceIndex) => {
                                        const hasDocument = source.document_id && source.document_id !== 'None' && source.document_id !== 'null' && source.document_id !== null;
                                        const sourceLabel = source.document_name
                                          ? source.document_name.length > 15
                                            ? source.document_name.substring(0, 15) + '...'
                                            : source.document_name
                                          : getDocumentTypeName(source);

                                        return (
                                          <button
                                            key={source.document_id || sourceIndex}
                                            onClick={() => hasDocument && handleSourceClick(source)}
                                            disabled={!hasDocument}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all ${
                                              hasDocument
                                                ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700 cursor-pointer'
                                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={hasDocument ? `Click to view: ${source.document_name || 'Document'}` : 'Document not available'}
                                          >
                                            <span className="flex-shrink-0">
                                              {getDocumentIcon(source)}
                                            </span>
                                            <span className="truncate max-w-[80px]">{sourceLabel}</span>
                                          </button>
                                        );
                                      })}

                                      {/* "Sources" button */}
                                      <button
                                        onClick={() => setSourcesListOpen(sourcesListOpen === index ? null : index)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-gray-400 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                                      >
                                        <span>Sources ({uniqueSources.length})</span>
                                        <svg className={`w-3 h-3 transition-transform ${sourcesListOpen === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Sources Popup */}
                              {sourcesListOpen === index && (
                                <div className="mt-3 p-4 bg-white border-2 border-gray-300 rounded-xl shadow-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-900">Citations</h4>
                                    <button
                                      onClick={() => setSourcesListOpen(null)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {(() => {
                                      const uniqueSources = Array.from(
                                        new Map(
                                          message.sources
                                            .filter(s => s.document_id && s.document_id !== 'None' && s.document_id !== 'null' && s.document_id !== null)
                                            .map(s => [s.document_id, s])
                                        ).values()
                                      );

                                      return uniqueSources.map((source, sourceIndex) => {
                                        const hasDocument = source.document_id;
                                        return (
                                          <button
                                            key={source.document_id || sourceIndex}
                                            onClick={() => {
                                              if (hasDocument) {
                                                handleSourceClick(source);
                                                setSourcesListOpen(null);
                                              }
                                            }}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-start gap-3"
                                          >
                                            <div className="flex-shrink-0 mt-0.5">
                                              {getDocumentIcon(source)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-xs text-gray-900 truncate">
                                                  {source.document_name}
                                                </p>
                                                {source.score && (
                                                  <span className="text-[10px] text-gray-500">
                                                    {(source.score * 100).toFixed(0)}%
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-gray-600 line-clamp-2">
                                                {source.text_preview || 'No preview available'}
                                              </p>
                                              <p className="text-[10px] text-gray-400 mt-1">
                                                {getDocumentTypeName(source)} • {source.timestamp ? new Date(source.timestamp).toLocaleDateString() : 'No date'}
                                              </p>
                                            </div>
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm rounded-3xl px-6 py-4 border border-purple-200/50 shadow-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        {/* Dynamic emoji */}
                        <span className="text-2xl animate-bounce">
                          {thinkingMessages[thinkingStep].icon}
                        </span>
                        <div className="flex flex-col gap-1">
                          {/* Main thinking message with fade transition */}
                          <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
                            {thinkingMessages[thinkingStep].text}
                          </span>
                          {/* Progress dots */}
                          <div className="flex gap-1">
                            {thinkingMessages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                  index === thinkingStep
                                    ? 'bg-purple-600 w-4'
                                    : index < thinkingStep
                                      ? 'bg-purple-400'
                                      : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
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

      {/* Source Document Modal - Clean & Simple */}
      {sourceModalOpen && selectedSource && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSourceModalOpen(false);
            setSelectedAttachment(null);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Simple Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                {getDocumentIcon(selectedSource)}
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedSource.title || 'Document'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getDocumentTypeName(selectedSource)} • {new Date(selectedSource.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSourceModalOpen(false);
                  setSelectedAttachment(null);
                }}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Adaptive based on type */}
            <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
              {(() => {
                const isEmail = selectedSource.source?.toLowerCase() === 'outlook' || selectedSource.source?.toLowerCase() === 'gmail';
                const hasAttachments = selectedSource.attachments && selectedSource.attachments.length > 0;
                const isImage = selectedSource.mime_type?.startsWith('image/');
                const isPDF = selectedSource.mime_type === 'application/pdf';

                // EMAIL - show like a real email with From/To/Subject
                if (isEmail) {
                  return (
                    <div>
                      {/* Email Headers */}
                      <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-2">
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-gray-500 w-16">Subject:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedSource.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-semibold text-gray-500 w-16">From:</span>
                          <span className="text-sm text-gray-800">
                            {selectedSource.sender_name || selectedSource.sender_address || 'Unknown'}
                            {selectedSource.sender_name && selectedSource.sender_address && (
                              <span className="text-gray-500"> &lt;{selectedSource.sender_address}&gt;</span>
                            )}
                          </span>
                        </div>
                        {selectedSource.to_addresses && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-16">To:</span>
                            <span className="text-sm text-gray-800">
                              {typeof selectedSource.to_addresses === 'string'
                                ? selectedSource.to_addresses
                                : Array.isArray(selectedSource.to_addresses)
                                  ? selectedSource.to_addresses.join(', ')
                                  : 'Unknown'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Email Body */}
                      <div className="p-6 border-b border-gray-200">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                          {selectedSource.content}
                        </pre>
                      </div>

                      {/* Attachments (if any) */}
                      {hasAttachments && (
                        <div className="p-6 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">
                              {selectedSource.attachments.length} Attachment{selectedSource.attachments.length !== 1 ? 's' : ''}
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {selectedSource.attachments.map((attachment: any) => (
                              <button
                                key={attachment.id}
                                onClick={() => setSelectedAttachment(attachment)}
                                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                              >
                                <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{attachment.title}</p>
                                  <p className="text-xs text-gray-500">
                                    {attachment.file_size_bytes ? `${(attachment.file_size_bytes / 1024).toFixed(1)} KB` : 'Email'}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // IMAGE - show image
                if (isImage && selectedSource.file_url) {
                  return (
                    <div className="p-6">
                      <img
                        src={selectedSource.file_url}
                        alt={selectedSource.title || 'Image'}
                        className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                      />
                      {selectedSource.content && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Extracted Text</p>
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                            {selectedSource.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }

                // PDF - show PDF viewer
                if (isPDF && selectedSource.file_url) {
                  return (
                    <div className="bg-gray-100">
                      <iframe
                        src={selectedSource.file_url}
                        className="w-full h-[600px]"
                        title="PDF Viewer"
                      />
                    </div>
                  );
                }

                // DEFAULT - just show text content
                return (
                  <div className="p-6">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                      {selectedSource.content || 'No content available'}
                    </pre>
                    {selectedSource.file_url && (
                      <a
                        href={selectedSource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Original
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Popup */}
      {selectedAttachment && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedAttachment(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedAttachment.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedAttachment.file_size_bytes
                      ? `${(selectedAttachment.file_size_bytes / 1024).toFixed(1)} KB`
                      : 'Email Attachment'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedAttachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </a>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-100">
              {(() => {
                // Determine attachment type and show appropriate viewer
                const isImage = selectedAttachment.mime_type?.startsWith('image/');
                const isPDF = selectedAttachment.mime_type === 'application/pdf';
                const isOfficeDoc = selectedAttachment.mime_type?.includes('officedocument') ||
                  selectedAttachment.mime_type?.includes('msword') ||
                  selectedAttachment.mime_type?.includes('ms-excel') ||
                  selectedAttachment.mime_type?.includes('ms-powerpoint');

                if (isImage) {
                  return (
                    <div className="flex items-center justify-center p-8 min-h-[500px]">
                      <img
                        src={selectedAttachment.file_url}
                        alt={selectedAttachment.title}
                        className="max-w-full max-h-[700px] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  );
                }

                if (isPDF) {
                  return (
                    <iframe
                      src={selectedAttachment.file_url}
                      className="w-full h-[700px]"
                      title={selectedAttachment.title}
                    />
                  );
                }

                if (isOfficeDoc) {
                  return (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedAttachment.file_url)}`}
                      className="w-full h-[700px]"
                      title={selectedAttachment.title}
                    />
                  );
                }

                // Fallback: show extracted text
                return (
                  <div className="p-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Email Content</p>
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                        {selectedAttachment.content || 'No preview available'}
                      </pre>
                    </div>
                  </div>
                );
              })()}
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
