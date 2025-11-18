"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { fetchStatus, startConnect, triggerInitialSync } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import InitialSyncModal from "@/components/connections/InitialSyncModal";
import { Loader2, Mail, HardDrive, DollarSign, RefreshCw, Check, User, Bell, Shield, Trash2, CheckCircle2 } from "lucide-react";

interface ConnectionStatus {
  tenant_id: string;
  providers: {
    outlook?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
      can_manual_sync?: boolean;
      initial_sync_completed?: boolean;
    };
    gmail?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
      can_manual_sync?: boolean;
      initial_sync_completed?: boolean;
    };
    google_drive?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
      can_manual_sync?: boolean;
      initial_sync_completed?: boolean;
    };
    quickbooks?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
      can_manual_sync?: boolean;
      initial_sync_completed?: boolean;
    };
  };
}

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncModalProvider, setSyncModalProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadConnectionStatus(true); // Force refresh on page load
    }
  }, [user]);

  const loadConnectionStatus = async (forceRefresh: boolean = false) => {
    try {
      const data = await fetchStatus(forceRefresh);
      setStatus(data);
      console.log("Connection status loaded:", data);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
      toast({
        variant: "destructive",
        title: "Failed to load connections",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleConnect = async (provider: "microsoft" | "gmail" | "google-drive" | "quickbooks") => {
    setConnecting(prev => ({ ...prev, [provider]: true }));
    try {
      const result = await startConnect(provider);
      const popup = window.open(result.auth_url, "oauth", "width=600,height=700");

      const checkInterval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkInterval);
          setConnecting(prev => ({ ...prev, [provider]: false }));
          loadConnectionStatus();
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "oauth-success") {
          clearInterval(checkInterval);
          setConnecting(prev => ({ ...prev, [provider]: false }));
          toast({
            title: "Connected!",
            description: `${provider} connected successfully`,
          });
          loadConnectionStatus();
          window.removeEventListener("message", messageHandler);
        } else if (event.data.type === "oauth-error") {
          clearInterval(checkInterval);
          setConnecting(prev => ({ ...prev, [provider]: false }));
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
        setConnecting(prev => ({ ...prev, [provider]: false }));
      }, 300000);
    } catch (error) {
      setConnecting(prev => ({ ...prev, [provider]: false }));
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start connection",
      });
    }
  };

  const handleSyncClick = (provider: string) => {
    setSyncModalProvider(provider);
  };

  const handleSyncConfirm = async () => {
    if (!syncModalProvider) return;

    const provider = syncModalProvider as "outlook" | "gmail" | "drive" | "quickbooks";
    const syncKey = provider === "drive" ? "google_drive" : provider;

    setSyncModalProvider(null);
    setSyncing(prev => ({ ...prev, [syncKey]: true }));

    try {
      const result = await triggerInitialSync(provider);
      toast({
        title: "Sync Started",
        description: result.message || "Historical sync has been started. You'll receive an email when complete (4-8 hours).",
      });
      loadConnectionStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
      });
    } finally {
      setSyncing(prev => ({ ...prev, [syncKey]: false }));
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

  // Build services array - recalculates on each render but that's fine for this small array
  const services = [
    {
      id: "outlook",
      name: "Outlook",
      description: "Sync emails from Microsoft Outlook",
      icon: Mail,
      gradient: "from-blue-500 to-blue-600",
      provider: "microsoft" as const,
      syncKey: "outlook" as const,
      syncProvider: "outlook" as const,
      connected: status?.providers?.outlook?.connected || false,
      canManualSync: status?.providers?.outlook?.can_manual_sync ?? true,
      initialSyncCompleted: status?.providers?.outlook?.initial_sync_completed ?? false,
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Sync emails from Google Gmail",
      icon: Mail,
      gradient: "from-red-500 to-pink-500",
      provider: "gmail" as const,
      syncKey: "gmail" as const,
      syncProvider: "gmail" as const,
      connected: status?.providers?.gmail?.connected || false,
      canManualSync: status?.providers?.gmail?.can_manual_sync ?? true,
      initialSyncCompleted: status?.providers?.gmail?.initial_sync_completed ?? false,
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Sync files from Google Drive",
      icon: HardDrive,
      gradient: "from-green-500 to-emerald-500",
      provider: "google-drive" as const,
      syncKey: "google_drive" as const,
      syncProvider: "drive" as const,
      connected: status?.providers?.google_drive?.connected || false,
      canManualSync: status?.providers?.google_drive?.can_manual_sync ?? true,
      initialSyncCompleted: status?.providers?.google_drive?.initial_sync_completed ?? false,
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync financial data",
      icon: DollarSign,
      gradient: "from-green-600 to-teal-600",
      provider: "quickbooks" as const,
      syncKey: "quickbooks" as const,
      syncProvider: "quickbooks" as const,
      connected: status?.providers?.quickbooks?.connected || false,
      canManualSync: status?.providers?.quickbooks?.can_manual_sync ?? true,
      initialSyncCompleted: status?.providers?.quickbooks?.initial_sync_completed ?? false,
    },
  ];

  return (
    <div className="flex h-full">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-normal text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 font-light">Manage your connections and account preferences</p>
          </div>

          {/* Connections Section */}
          <div className="mb-12">
            <h2 className="text-xl font-normal text-gray-900 mb-6">Data Connections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <h3 className="text-lg font-normal text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500 font-light mt-1">{service.description}</p>
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
                        className={`w-full py-3 px-4 rounded-xl text-white font-normal transition-all disabled:opacity-50 bg-gradient-to-r ${service.gradient} hover:opacity-90`}
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
                    ) : service.canManualSync ? (
                      <button
                        onClick={() => handleSyncClick(service.syncProvider)}
                        disabled={isSyncing}
                        className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-normal transition-all disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Starting Sync...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span>Sync Now (1 Year - One Time)</span>
                          </div>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-50 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-normal">Initial Sync Complete • Auto-Sync Enabled</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6 mt-8">
            <h2 className="text-xl font-normal text-gray-900">Account Settings</h2>

            {/* Account Information */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Account Information</h3>
                  <p className="text-sm text-gray-500 font-light">Your profile details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    Email Address
                  </label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    User ID
                  </label>
                  <p className="text-sm font-mono text-gray-900">{user.id}</p>
                </div>
                {status && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                      Tenant ID
                    </label>
                    <p className="text-sm font-mono text-gray-900">{status.tenant_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500 font-light">Manage notification preferences</p>
                </div>
              </div>

              <div className="text-center py-8">
                <p className="text-sm text-gray-400 font-light">Notification settings coming soon</p>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Privacy & Security</h3>
                  <p className="text-sm text-gray-500 font-light">Manage your security settings</p>
                </div>
              </div>

              <div className="text-center py-8">
                <p className="text-sm text-gray-400 font-light">Security settings coming soon</p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-3xl p-8 border border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Danger Zone</h3>
                  <p className="text-sm text-gray-500 font-light">Irreversible actions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div>
                    <p className="text-sm font-normal text-gray-900">Delete Account</p>
                    <p className="text-xs text-gray-500 font-light mt-1">Permanently delete your account and all data</p>
                  </div>
                  <button
                    disabled
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-normal rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      {syncModalProvider && (
        <InitialSyncModal
          providerName={services.find(s => s.syncProvider === syncModalProvider)?.name || syncModalProvider}
          onConfirm={handleSyncConfirm}
          onCancel={() => setSyncModalProvider(null)}
        />
      )}
    </div>
  );
}
