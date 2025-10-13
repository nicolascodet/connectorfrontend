const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL environment variable is not set");
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

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
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
  provider: "microsoft" | "gmail",
  tenantId: string
): Promise<{ auth_url: string; provider: string; tenant_id: string }> {
  return apiGet("/connect/start", { provider, tenantId });
}

export async function fetchStatus(tenantId: string): Promise<{
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
  return apiGet("/status", { tenantId });
}

export async function syncOutlookOnce(tenantId: string): Promise<any> {
  return apiGet("/sync/once/outlook", { tenantId });
}

export async function syncGmailOnce(tenantId: string): Promise<any> {
  return apiGet("/sync/once/gmail", { tenantId });
}
