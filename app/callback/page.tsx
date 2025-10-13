"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { handleOAuthCallback } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing OAuth callback...");

  useEffect(() => {
    async function processCallback() {
      try {
        // Get connection details from URL params (Nango redirects with these)
        const connectionId = searchParams.get("connection_id");
        const providerConfigKey = searchParams.get("provider_config_key");

        // Get stored tenant ID from localStorage
        const tenantId = localStorage.getItem("nango_tenant_id");

        if (!connectionId) {
          throw new Error("Missing connection_id from Nango redirect");
        }

        if (!providerConfigKey) {
          throw new Error("Missing provider_config_key from Nango redirect");
        }

        if (!tenantId) {
          throw new Error("Missing tenant ID - please start the connection flow again");
        }

        setMessage("Saving connection to backend...");

        // Call backend to save the connection
        await handleOAuthCallback({
          tenantId,
          providerConfigKey,
          connectionId,
        });

        setStatus("success");
        setMessage("Connection successful! Redirecting...");

        // Clean up and redirect back to main page
        localStorage.removeItem("nango_tenant_id");

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to complete OAuth callback"
        );

        // Redirect back after showing error
        setTimeout(() => {
          router.push("/");
        }, 5000);
      }
    }

    processCallback();
  }, [searchParams, router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "processing" && "Processing..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {status === "processing" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            )}
            {status === "success" && (
              <div className="text-green-600 text-5xl">✓</div>
            )}
            {status === "error" && (
              <div className="text-red-600 text-5xl">✗</div>
            )}
            <p className="text-center text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
