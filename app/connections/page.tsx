"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { fetchStatus, startConnect, syncOutlookOnce, syncGmailOnce, syncGoogleDriveOnce } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, HardDrive, RefreshCw, Plug2, Building2, DollarSign } from "lucide-react";
import TopNav from "@/components/TopNav";

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
    quickbooks?: {
      configured: boolean;
      connected: boolean;
      connection_id: string | null;
    };
  };
}

export default function ConnectionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingConnect, setLoadingConnect] = useState<{
    microsoft: boolean;
    gmail: boolean;
    "google-drive": boolean;
    quickbooks: boolean;
  }>({ microsoft: false, gmail: false, "google-drive": false, quickbooks: false });
  const [loadingSync, setLoadingSync] = useState<{ 
    outlook: boolean;
    gmail: boolean;
    google_drive: boolean;
  }>({
    outlook: false,
    gmail: false,
    google_drive: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch status",
      });
    }
  };

  const handleConnect = async (provider: "microsoft" | "gmail" | "google-drive" | "quickbooks") => {
    setLoadingConnect((prev) => ({ ...prev, [provider]: true }));
    try {
      const result = await startConnect(provider);
      const popup = window.open(result.auth_url, "oauth", "width=600,height=700,left=100,top=100");

      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          loadStatus();
        }
      }, 500);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "oauth-success") {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          toast({
            title: "Connection Successful",
            description: `${event.data.provider} connected successfully!`,
          });
          loadStatus();
          window.removeEventListener("message", messageHandler);
        } else if (event.data.type === "oauth-error") {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: event.data.error || "Failed to save connection",
          });
          window.removeEventListener("message", messageHandler);
        }
      };

      window.addEventListener("message", messageHandler);

      setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener("message", messageHandler);
        setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
      }, 300000);
    } catch (error) {
      setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Failed to connect ${provider}`,
      });
    }
  };

  const handleSyncOutlook = async () => {
    setLoadingSync((prev) => ({ ...prev, outlook: true }));
    try {
      const result = await syncOutlookOnce();
      await loadStatus();
      toast({
        title: "Sync Complete",
        description: result.message || "Outlook synced successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Outlook",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, outlook: false }));
    }
  };

  const handleSyncGmail = async () => {
    setLoadingSync((prev) => ({ ...prev, gmail: true }));
    try {
      const result = await syncGmailOnce();
      await loadStatus();
      toast({
        title: "Sync Complete",
        description: result.message || "Gmail synced successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Gmail",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, gmail: false }));
    }
  };

  const handleSyncGoogleDrive = async () => {
    setLoadingSync((prev) => ({ ...prev, google_drive: true }));
    try {
      const result = await syncGoogleDriveOnce();
      await loadStatus();
      toast({
        title: "Sync Complete",
        description: result.message || "Google Drive synced successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync Google Drive",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, google_drive: false }));
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <TopNav />

      <div className="flex-1 overflow-y-auto p-8 pt-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Connections</h1>
            <p className="text-gray-600">Connect and manage your data sources - Outlook, Gmail, Drive, QuickBooks</p>
          </div>

          {/* Connect Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outlook */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-700/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Outlook</h3>
                    <p className="text-sm text-gray-600">Email synchronization</p>
                  </div>
                </div>
                {status?.providers?.outlook?.connected && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleConnect("microsoft")}
                  disabled={loadingConnect.microsoft || status?.providers?.outlook?.connected}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white border-0"
                >
                  {loadingConnect.microsoft ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status?.providers?.outlook?.connected ? (
                    "Connected"
                  ) : (
                    "Connect Outlook"
                  )}
                </Button>

                {status?.providers?.outlook?.connected && (
                  <Button
                    onClick={handleSyncOutlook}
                    disabled={loadingSync.outlook}
                    variant="outline"
                    className="w-full rounded-xl py-4 border-2"
                  >
                    {loadingSync.outlook ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loadingSync.outlook ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
              </div>
            </div>

            {/* Gmail */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gmail</h3>
                    <p className="text-sm text-gray-600">Email synchronization</p>
                  </div>
                </div>
                {status?.providers?.gmail?.connected && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleConnect("gmail")}
                  disabled={loadingConnect.gmail || status?.providers?.gmail?.connected}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
                >
                  {loadingConnect.gmail ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status?.providers?.gmail?.connected ? (
                    "Connected"
                  ) : (
                    "Connect Gmail"
                  )}
                </Button>

                {status?.providers?.gmail?.connected && (
                  <Button
                    onClick={handleSyncGmail}
                    disabled={loadingSync.gmail}
                    variant="outline"
                    className="w-full rounded-xl py-4 border-2"
                  >
                    {loadingSync.gmail ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loadingSync.gmail ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
              </div>
            </div>

            {/* Google Drive */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <HardDrive className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Google Drive</h3>
                    <p className="text-sm text-gray-600">File synchronization</p>
                  </div>
                </div>
                {status?.providers?.google_drive?.connected && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleConnect("google-drive")}
                  disabled={loadingConnect["google-drive"] || status?.providers?.google_drive?.connected}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                >
                  {loadingConnect["google-drive"] ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status?.providers?.google_drive?.connected ? (
                    "Connected"
                  ) : (
                    "Connect Google Drive"
                  )}
                </Button>

                {status?.providers?.google_drive?.connected && (
                  <Button
                    onClick={handleSyncGoogleDrive}
                    disabled={loadingSync.google_drive}
                    variant="outline"
                    className="w-full rounded-xl py-4 border-2"
                  >
                    {loadingSync.google_drive ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {loadingSync.google_drive ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
              </div>
            </div>

            {/* QuickBooks */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-600/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">QuickBooks</h3>
                    <p className="text-sm text-gray-600">Accounting data</p>
                  </div>
                </div>
                {status?.providers?.quickbooks?.connected && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleConnect("quickbooks")}
                  disabled={loadingConnect.quickbooks || status?.providers?.quickbooks?.connected}
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                >
                  {loadingConnect.quickbooks ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status?.providers?.quickbooks?.connected ? (
                    "Connected"
                  ) : (
                    "Connect QuickBooks"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Status Info */}
          {status && (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Plug2 className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Connection Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Tenant ID</p>
                  <p className="text-xs font-mono text-gray-900 mt-1">{status.tenant_id}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Outlook</p>
                  <p className="text-xs font-medium text-gray-900 mt-1">
                    {status.providers?.outlook?.connected ? "✓ Active" : "Not connected"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Gmail</p>
                  <p className="text-xs font-medium text-gray-900 mt-1">
                    {status.providers.gmail.connected ? "✓ Active" : "Not connected"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Google Drive</p>
                  <p className="text-xs font-medium text-gray-900 mt-1">
                    {status.providers?.google_drive?.connected ? "✓ Active" : "Not connected"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">QuickBooks</p>
                  <p className="text-xs font-medium text-gray-900 mt-1">
                    {status.providers?.quickbooks?.connected ? "✓ Active" : "Not connected"}
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

