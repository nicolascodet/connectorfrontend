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
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
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
  };
}

export function ConnectCard() {
  const [tenantId, setTenantId] = useState("acme");
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
      const data = await fetchStatus(tenantId);
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
      const result = await startConnect(provider, tenantId);
      // Backend handles tenant ID tracking and redirects back to home page
      window.location.href = result.auth_url;
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
      const result = await syncOutlookOnce(tenantId);
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
      const result = await syncGmailOnce(tenantId);
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Nango Connect</CardTitle>
        <CardDescription>
          Connect your Microsoft and Gmail accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="tenantId" className="text-sm font-medium">
            Tenant ID
          </label>
          <div className="flex gap-2">
            <Input
              id="tenantId"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Enter tenant ID"
            />
            <Button onClick={loadStatus} variant="outline">
              Refresh
            </Button>
          </div>
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
                      status.providers.gmail.connected
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {status.providers.gmail.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
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
              disabled={loadingSync.gmail || !status?.providers.gmail.connected}
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
