import { supabase } from "./supabase";
import { withCache, cache } from "./cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL environment variable is not set");
}

// Types
export interface ChatHistoryItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: any;
  created_at: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function apiGet(
  path: string,
  params?: Record<string, string>
): Promise<any> {
  const url = new URL(path, BACKEND_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

export async function startConnect(
  provider: "microsoft" | "gmail" | "google-drive" | "quickbooks"
): Promise<{ auth_url: string; provider: string; tenant_id: string }> {
  // Now support dedicated google-drive provider in backend
  return apiGet("/connect/start", { provider });
}

export async function fetchStatus(): Promise<{
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
}> {
  return withCache("connection-status", () => apiGet("/status"), 30); // Cache for 30 seconds
}

export async function syncOutlookOnce(): Promise<any> {
  const result = await apiGet("/sync/once");
  cache.invalidate("connection-status");
  return result;
}

export async function syncGmailOnce(): Promise<any> {
  const result = await apiGet("/sync/once/gmail");
  cache.invalidate("connection-status");
  return result;
}

export async function syncGoogleDriveOnce(): Promise<any> {
  // Backend endpoint is /sync/once/drive
  const result = await apiGet("/sync/once/drive");
  cache.invalidate("connection-status");
  return result;
}

export async function syncQuickBooksOnce(): Promise<any> {
  const result = await apiGet("/sync/once/quickbooks");
  cache.invalidate("connection-status");
  cache.invalidatePattern("quickbooks-"); // Invalidate all QuickBooks dashboard caches
  return result;
}

export async function handleOAuthCallback(data: {
  connectionId: string;
  providerConfigKey: string;
}): Promise<any> {
  const url = new URL("/nango/oauth/callback", BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `OAuth callback failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

export async function searchOptimized(data: {
  query: string;
  vector_limit?: number;
  graph_limit?: number;
  conversation_history?: Array<{ role: string; content: string }>;
  include_full_emails?: boolean;
}): Promise<{
  success: boolean;
  query: string;
  answer: string;
  vector_results: Array<any>;
  graph_results: Array<any>;
  num_episodes: number;
  message: string;
}> {
  const url = new URL("/api/v1/search", BACKEND_URL);
  const baseHeaders = await getAuthHeaders();

  // Add X-API-Key to the headers (from environment variable)
  const apiKey = process.env.NEXT_PUBLIC_CORTEX_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_CORTEX_API_KEY environment variable is not set");
  }

  const headers = {
    ...baseHeaders,
    "X-API-Key": apiKey,
  };

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: data.query,
      vector_limit: data.vector_limit || 5,
      graph_limit: data.graph_limit || 5,
      conversation_history: data.conversation_history || [],
      include_full_emails: data.include_full_emails !== false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Search failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json();
}

// Chat History APIs
export async function getChatHistory(): Promise<{ chats: ChatHistoryItem[] }> {
  return withCache("chat-history", () => apiGet("/api/v1/chats"), 60); // Cache for 60 seconds
}

export async function getChatMessages(chatId: string): Promise<{ messages: ChatMessage[] }> {
  return withCache(`chat-messages-${chatId}`, () => apiGet(`/api/v1/chats/${chatId}/messages`), 300); // Cache for 5 minutes
}

export async function createNewChat(title?: string): Promise<{ chat_id: string }> {
  const url = new URL("/api/v1/chats", BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteChat(chatId: string): Promise<{ success: boolean }> {
  const url = new URL(`/api/v1/chats/${chatId}`, BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete chat: ${response.statusText}`);
  }

  return response.json();
}

export async function sendChatMessage(question: string, chatId?: string): Promise<{
  question: string;
  answer: string;
  source_count: number;
  sources: any[];
  chat_id: string;
}> {
  const url = new URL("/api/v1/chat", BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      question,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Chat failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();

  // Invalidate caches after sending a message
  cache.invalidate("chat-history");
  if (result.chat_id) {
    cache.invalidate(`chat-messages-${result.chat_id}`);
  }

  return result;
}

export interface Attachment {
  id: string;
  title: string;
  file_url: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  document_type: string;
  content: string;
}

export async function getSourceDocument(documentId: string): Promise<{
  id: string;
  title: string;
  content: string;
  metadata: any;
  source: string;
  created_at: string;
  // File storage fields (for PDFs, images, etc.)
  file_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  // Email fields (for Outlook/Gmail)
  sender_name?: string | null;
  sender_address?: string | null;
  to_addresses?: string | string[] | null;
  // Attachments array (for emails with attachments)
  attachments: Attachment[];
}> {
  return apiGet(`/api/v1/sources/${documentId}`);
}

// File Upload API
export async function uploadFile(file: File, chatId?: string): Promise<{
  success: boolean;
  filename: string;
  file_type?: string;
  characters?: number;
  message: string;
}> {
  const url = new URL("/api/v1/upload/file", BACKEND_URL);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Dashboard APIs
export async function getQuickBooksOverview(days: number = 30): Promise<any> {
  return withCache(`quickbooks-overview-${days}`, () => apiGet("/api/v1/dashboard/quickbooks/overview", { days: days.toString() }), 120); // Cache for 2 minutes
}

export async function getQuickBooksInvoices(days: number = 30, limit: number = 50): Promise<any> {
  return withCache(`quickbooks-invoices-${days}-${limit}`, () => apiGet("/api/v1/dashboard/quickbooks/invoices", { days: days.toString(), limit: limit.toString() }), 120);
}

export async function getQuickBooksBills(days: number = 30, limit: number = 50): Promise<any> {
  return withCache(`quickbooks-bills-${days}-${limit}`, () => apiGet("/api/v1/dashboard/quickbooks/bills", { days: days.toString(), limit: limit.toString() }), 120);
}

export async function getQuickBooksPayments(days: number = 30, limit: number = 50): Promise<any> {
  return withCache(`quickbooks-payments-${days}-${limit}`, () => apiGet("/api/v1/dashboard/quickbooks/payments", { days: days.toString(), limit: limit.toString() }), 120);
}

// Intelligence APIs
export async function getDailyIntelligence(date?: string): Promise<any> {
  const path = date ? `/api/v1/intelligence/daily` : `/api/v1/intelligence/daily/latest`;
  const params = date ? { date } : undefined;
  return withCache(`daily-intelligence-${date || "latest"}`, () => apiGet(path, params), 300); // 5 min cache
}

export async function getWeeklyIntelligence(weekStart?: string): Promise<any> {
  const path = weekStart ? `/api/v1/intelligence/weekly` : `/api/v1/intelligence/weekly/latest`;
  const params = weekStart ? { week_start: weekStart } : undefined;
  return withCache(`weekly-intelligence-${weekStart || "latest"}`, () => apiGet(path, params), 600); // 10 min cache
}

export async function getMonthlyIntelligence(month?: string): Promise<any> {
  const path = month ? `/api/v1/intelligence/monthly` : `/api/v1/intelligence/monthly/latest`;
  const params = month ? { month } : undefined;
  return withCache(`monthly-intelligence-${month || "latest"}`, () => apiGet(path, params), 1800); // 30 min cache
}

export async function getDailyTrends(days: number = 30): Promise<any> {
  return withCache(`daily-trends-${days}`, () => apiGet("/api/v1/intelligence/trends/daily", { days: days.toString() }), 300);
}

export async function getWeeklyTrends(weeks: number = 12): Promise<any> {
  return withCache(`weekly-trends-${weeks}`, () => apiGet("/api/v1/intelligence/trends/weekly", { weeks: weeks.toString() }), 600);
}

export async function getMonthlyTrends(months: number = 12): Promise<any> {
  return withCache(`monthly-trends-${months}`, () => apiGet("/api/v1/intelligence/trends/monthly", { months: months.toString() }), 1800);
}

// Analytics APIs (to be implemented in backend)
export async function getTrendingEntities(days: number = 30, limit: number = 10): Promise<any> {
  return apiGet("/api/v1/analytics/entities/trending", { days: days.toString(), limit: limit.toString() });
}

export async function getCommunicationPatterns(days: number = 30): Promise<any> {
  return apiGet("/api/v1/analytics/communication/patterns", { days: days.toString() });
}

export async function getDealMomentum(days: number = 30): Promise<any> {
  return apiGet("/api/v1/analytics/deals/momentum", { days: days.toString() });
}

export async function getSentimentAnalysis(days: number = 30): Promise<any> {
  return apiGet("/api/v1/analytics/sentiment/analysis", { days: days.toString() });
}

export async function getRelationshipNetwork(): Promise<any> {
  return apiGet("/api/v1/analytics/relationships/network");
}
