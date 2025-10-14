import { supabase } from "./supabase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL environment variable is not set");
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
  provider: "microsoft" | "gmail"
): Promise<{ auth_url: string; provider: string; tenant_id: string }> {
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
  };
}> {
  return apiGet("/status");
}

export async function syncOutlookOnce(): Promise<any> {
  return apiGet("/sync/once");
}

export async function syncGmailOnce(): Promise<any> {
  return apiGet("/sync/once/gmail");
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

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "cortex_dev_key_12345",
    },
    body: JSON.stringify({
      query: data.query,
      vector_limit: data.vector_limit || 5,
      graph_limit: data.graph_limit || 5,
      conversation_history: data.conversation_history || [],
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
