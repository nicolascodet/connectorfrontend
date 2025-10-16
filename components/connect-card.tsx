"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  startConnect,
  fetchStatus,
  syncOutlookOnce,
  syncGmailOnce,
} from "@/lib/api";

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

export function ConnectCard() {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingConnect, setLoadingConnect] = useState<{
    microsoft: boolean;
    gmail: boolean;
  }>({ microsoft: false, gmail: false });
  const [loadingSync, setLoadingSync] = useState<{
    outlook: boolean;
    gmail: boolean;
  }>({ outlook: false, gmail: false });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch status",
      });
    }
  };

  const handleConnect = async (provider: "microsoft" | "gmail") => {
    setLoadingConnect((prev) => ({ ...prev, [provider]: true }));
    try {
      const result = await startConnect(provider);

      // Open OAuth in popup window
      const popup = window.open(
        result.auth_url,
        "oauth",
        "width=600,height=700,left=100,top=100"
      );

      // Poll to check if popup is closed
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setLoadingConnect((prev) => ({ ...prev, [provider]: false }));
          // Refresh status after popup closes
          loadStatus();
        }
      }, 500);

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        // Verify message origin for security
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

      // Cleanup after 5 minutes
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
        description:
          error instanceof Error
            ? error.message
            : `Failed to connect ${provider}`,
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
        description:
          error instanceof Error ? error.message : "Failed to sync Outlook",
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
        description:
          error instanceof Error ? error.message : "Failed to sync Gmail",
      });
    } finally {
      setLoadingSync((prev) => ({ ...prev, gmail: false }));
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Nango Connect</CardTitle>
            <CardDescription>
              Connect your Microsoft and Gmail accounts
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="mt-1">
              Logout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={loadStatus} variant="outline" size="sm">
            Refresh Status
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Connect Accounts</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleConnect("microsoft")}
              disabled={loadingConnect.microsoft}
              className="flex-1"
            >
              {loadingConnect.microsoft ? "Connecting..." : "Connect Microsoft"}
            </Button>
            <Button
              onClick={() => handleConnect("gmail")}
              disabled={loadingConnect.gmail}
              className="flex-1"
            >
              {loadingConnect.gmail ? "Connecting..." : "Connect Google"}
            </Button>
          </div>
        </div>

        {status && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Connection Status</h3>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tenant ID:</span>
                  <span className="font-medium">{status.tenant_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outlook:</span>
                  <span
                    className={
                      status.providers.outlook.connected
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {status.providers.outlook.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gmail:</span>
                  <span
                    className={
                      status.providers?.gmail?.connected
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {status.providers?.gmail?.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                {status.providers?.google_drive && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Google Drive:</span>
                    <span
                      className={
                        status.providers?.google_drive?.connected
                          ? "text-green-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {status.providers?.google_drive?.connected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Manual Sync</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleSyncOutlook}
              disabled={
                loadingSync.outlook || !status?.providers.outlook.connected
              }
              variant="outline"
              className="flex-1"
            >
              {loadingSync.outlook ? "Syncing..." : "Sync Outlook Once"}
            </Button>
            <Button
              onClick={handleSyncGmail}
              disabled={loadingSync.gmail || !status?.providers?.gmail?.connected}
              variant="outline"
              className="flex-1"
            >
              {loadingSync.gmail ? "Syncing..." : "Sync Gmail Once"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
