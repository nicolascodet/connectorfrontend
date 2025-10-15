"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchOptimized } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await searchOptimized({
        query: input,
        vector_limit: 5,
        graph_limit: 10,
        conversation_history: conversationHistory,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description:
          error instanceof Error ? error.message : "Failed to search",
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-8">
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
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
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
    </main>
  );
}
