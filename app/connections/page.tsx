"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { fetchStatus, startConnect, syncOutlookOnce, syncGmailOnce, syncGoogleDriveOnce, syncQuickBooksOnce } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import { Loader2, Mail, HardDrive, DollarSign, RefreshCw, Check } from "lucide-react";

interface ConnectionStatus {
  tenant_id: string;
  providers: {
    outlook?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
    gmail?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
    google_drive?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
    quickbooks?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
  };
}

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadConnectionStatus();
    }
  }, [user]);

  const loadConnectionStatus = async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
    }
  };

  const handleConnect = async (provider: "microsoft" | "gmail" | "google-drive" | "quickbooks") => {
    setConnecting({ ...connecting, [provider]: true });
    try {
      const result = await startConnect(provider);
      const popup = window.open(result.auth_url, "oauth", "width=600,height=700");

      const checkInterval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkInterval);
          setConnecting({ ...connecting, [provider]: false });
          loadConnectionStatus();
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "oauth-success") {
          clearInterval(checkInterval);
          setConnecting({ ...connecting, [provider]: false });
          toast({
            title: "Connected!",
            description: `${provider} connected successfully`,
          });
          loadConnectionStatus();
          window.removeEventListener("message", messageHandler);
        } else if (event.data.type === "oauth-error") {
          clearInterval(checkInterval);
          setConnecting({ ...connecting, [provider]: false });
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: event.data.error || "Failed to connect",
          });
          window.removeEventListener("message", messageHandler);
        }
      };

      window.addEventListener("message", messageHandler);

      setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener("message", messageHandler);
        setConnecting({ ...connecting, [provider]: false });
      }, 300000);
    } catch (error) {
      setConnecting({ ...connecting, [provider]: false });
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start connection",
      });
    }
  };

  const handleSync = async (provider: "outlook" | "gmail" | "google_drive" | "quickbooks") => {
    setSyncing({ ...syncing, [provider]: true });
    try {
      let result;
      if (provider === "outlook") {
        result = await syncOutlookOnce();
      } else if (provider === "gmail") {
        result = await syncGmailOnce();
      } else if (provider === "google_drive") {
        result = await syncGoogleDriveOnce();
      } else if (provider === "quickbooks") {
        result = await syncQuickBooksOnce();
      }

      toast({
        title: "Sync Complete",
        description: result?.message || "Data synced successfully",
      });
      loadConnectionStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync",
      });
    } finally {
      setSyncing({ ...syncing, [provider]: false });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  const services = [
    {
      id: "outlook",
      name: "Outlook",
      description: "Sync emails from Microsoft Outlook",
      icon: Mail,
      gradient: "from-blue-500 to-blue-600",
      provider: "microsoft" as const,
      syncKey: "outlook" as const,
      connected: status?.providers?.outlook?.connected || false,
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Sync emails from Google Gmail",
      icon: Mail,
      gradient: "from-red-500 to-pink-500",
      provider: "gmail" as const,
      syncKey: "gmail" as const,
      connected: status?.providers?.gmail?.connected || false,
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Sync files from Google Drive",
      icon: HardDrive,
      gradient: "from-green-500 to-emerald-500",
      provider: "google-drive" as const,
      syncKey: "google_drive" as const,
      connected: status?.providers?.google_drive?.connected || false,
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync financial data",
      icon: DollarSign,
      gradient: "from-green-600 to-teal-600",
      provider: "quickbooks" as const,
      syncKey: "quickbooks" as const,
      connected: status?.providers?.quickbooks?.connected || false,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Connections</h1>
            <p className="text-gray-600">Connect your data sources to HighForce</p>
          </div>

          {/* Connection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {services.map((service) => {
              const Icon = service.icon;
              const isConnecting = connecting[service.provider] || false;
              const isSyncing = syncing[service.syncKey] || false;

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      </div>
                    </div>
                    {service.connected && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Connected</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {!service.connected ? (
                      <button
                        onClick={() => handleConnect(service.provider)}
                        disabled={isConnecting}
                        className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all disabled:opacity-50 bg-gradient-to-r ${service.gradient} hover:opacity-90`}
                      >
                        {isConnecting ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </div>
                        ) : (
                          `Connect ${service.name}`
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSync(service.syncKey)}
                        disabled={isSyncing}
                        className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition-all disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Syncing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span>Sync Now</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Account Info */}
          {status && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tenant ID</p>
                  <p className="text-sm font-mono text-gray-900">{status.tenant_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Active Connections</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {Object.values(status.providers).filter((p) => p?.connected).length} of {Object.keys(status.providers).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
