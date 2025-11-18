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

export async function apiPost(
  path: string,
  body?: any
): Promise<any> {
  const url = new URL(path, BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

export async function fetchStatus(skipCache: boolean = false): Promise<{
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
  if (skipCache) {
    cache.invalidate("connection-status");
  }
  return withCache("connection-status", () => apiGet("/status"), 10); // Cache for 10 seconds (reduced from 30)
}

// Initial sync (one-time, 1-year backfill) - locks manual sync after use
export async function triggerInitialSync(provider: "outlook" | "gmail" | "drive" | "quickbooks"): Promise<any> {
  const result = await apiPost(`/sync/initial/${provider}`);
  cache.invalidate("connection-status");
  if (provider === "quickbooks") {
    cache.invalidatePattern("quickbooks-");
  }
  return result;
}

// Legacy manual sync endpoints (still available for testing)
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

// ============================================================================
// RAG-Powered Intelligence Insights
// ============================================================================

export async function getLatestInsights(timePeriod: string = "daily", limit: number = 5): Promise<any> {
  return apiGet("/api/v1/insights/latest", { time_period: timePeriod, limit: limit.toString() });
}

export async function generateInsights(): Promise<any> {
  return apiPost("/api/v1/insights/generate", {});
}

export async function getDrillDownReport(widgetTitle: string, widgetMessage: string): Promise<any> {
  return apiPost("/api/v1/insights/drill-down", {
    widget_title: widgetTitle,
    widget_message: widgetMessage
  });
}

// ============================================================================
// Real-Time Alerts API
// ============================================================================

export async function getActiveAlerts(urgencyFilter?: string, limit?: number): Promise<any> {
  const params: Record<string, string> = {};
  if (urgencyFilter) params.urgency_filter = urgencyFilter;
  if (limit) params.limit = limit.toString();
  return apiGet("/api/v1/alerts/active", params);
}

export async function getAlertStats(): Promise<any> {
  return apiGet("/api/v1/alerts/stats");
}

export async function dismissAlert(alertId: number, note?: string): Promise<any> {
  return apiPost(`/api/v1/alerts/${alertId}/dismiss`, { note });
}

export async function investigateAlert(alertId: number): Promise<any> {
  return apiPost(`/api/v1/alerts/${alertId}/investigate`, {});
}

export async function getAlertDetails(alertId: number): Promise<any> {
  return apiGet(`/api/v1/alerts/${alertId}`);
}

export async function getAlertHistory(days: number = 30, includeDismissed: boolean = true): Promise<any> {
  return apiGet("/api/v1/alerts/history", {
    days: days.toString(),
    include_dismissed: includeDismissed.toString()
  });
}

export async function backfillUrgencyDetection(limit: number = 100, onlyRecent: boolean = true): Promise<any> {
  const params = { limit: limit.toString(), only_recent: onlyRecent.toString() };
  return apiGet("/api/v1/alerts/backfill", params);
}

// ============================================================================
// Saved Reports API
// ============================================================================

export async function saveReport(data: {
  title: string;
  report_type: string;
  report_data: any;
  description?: string;
  source_widget_title?: string;
  source_widget_message?: string;
  source_alert_id?: number;
  source_query?: string;
  tags?: string[];
}): Promise<any> {
  return apiPost("/api/v1/reports/save", data);
}

export async function listReports(reportType?: string, starredOnly?: boolean, limit?: number, offset?: number): Promise<any> {
  const params: Record<string, string> = {};
  if (reportType) params.report_type = reportType;
  if (starredOnly) params.starred_only = "true";
  if (limit) params.limit = limit.toString();
  if (offset) params.offset = offset.toString();
  return apiGet("/api/v1/reports/list", params);
}

export async function getReport(reportId: number): Promise<any> {
  return apiGet(`/api/v1/reports/${reportId}`);
}

export async function toggleReportStar(reportId: number): Promise<any> {
  return apiPost(`/api/v1/reports/${reportId}/star`, {});
}

export async function updateReport(reportId: number, data: {
  title?: string;
  description?: string;
  tags?: string[];
}): Promise<any> {
  return apiPost(`/api/v1/reports/${reportId}`, data);
}

export async function deleteReport(reportId: number): Promise<any> {
  const url = new URL(`/api/v1/reports/${reportId}`, BACKEND_URL);
  const headers = await getAuthHeaders();

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function searchReports(query: string, limit?: number): Promise<any> {
  const params: Record<string, string> = { q: query };
  if (limit) params.limit = limit.toString();
  return apiGet("/api/v1/reports/search", params);
}

export async function getReportStats(): Promise<any> {
  return apiGet("/api/v1/reports/stats");
}

// ============================================================================
// Daily Reports API
// ============================================================================

export async function generateDailyReport(reportType: string, reportDate?: string): Promise<any> {
  return apiPost("/api/v1/reports/daily/generate", {
    report_type: reportType,
    report_date: reportDate
  });
}

export async function getDailyReport(reportDate: string, reportType: string): Promise<any> {
  const params: Record<string, string> = { report_type: reportType };
  return apiGet(`/api/v1/reports/daily/${reportDate}`, params);
}

export async function getAllDailyReportsForDate(reportDate: string): Promise<any> {
  return apiGet(`/api/v1/reports/daily/${reportDate}/all`);
}

export async function getLatestDailyReports(limit: number = 7): Promise<any> {
  return apiGet("/api/v1/reports/daily/latest", { limit: limit.toString() });
}
