"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncConnectionFromNango } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing OAuth connection...");
  const [provider, setProvider] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract provider from URL parameters
        // Nango may pass connectionId, hmac, or other params
        const connectionId = searchParams.get("connectionId");
        const providerConfigKey = searchParams.get("providerConfigKey");

        // Determine provider from config key or connection ID
        let detectedProvider: "microsoft" | "gmail" = "microsoft";
        if (providerConfigKey?.includes("gmail") || providerConfigKey?.includes("google")) {
          detectedProvider = "gmail";
        }

        setProvider(detectedProvider === "microsoft" ? "Outlook" : "Gmail");

        // Call sync endpoint to ensure connection is saved
        const result = await syncConnectionFromNango(detectedProvider);

        if (result.status === "synced" || result.status === "already_synced") {
          setStatus("success");
          setMessage(
            result.status === "synced"
              ? "Connection successfully saved!"
              : "Connection already exists!"
          );

          // Notify parent window (if opened as popup)
          if (window.opener) {
            window.opener.postMessage({ type: "oauth-success" }, window.location.origin);
          }

          // Redirect to connections page after 2 seconds
          setTimeout(() => {
            router.push("/connections");
          }, 2000);
        } else if (result.status === "no_connection") {
          setStatus("error");
          setMessage("No connection found in Nango. Please try connecting again.");

          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage(
              { type: "oauth-error", error: "No connection found" },
              window.location.origin
            );
          }

          setTimeout(() => {
            router.push("/connections");
          }, 3000);
        } else {
          setStatus("success");
          setMessage("Connection processed successfully!");

          if (window.opener) {
            window.opener.postMessage({ type: "oauth-success" }, window.location.origin);
          }

          setTimeout(() => {
            router.push("/connections");
          }, 2000);
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to process OAuth callback"
        );

        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage(
            { type: "oauth-error", error: error instanceof Error ? error.message : "Unknown error" },
            window.location.origin
          );
        }

        // Redirect even on error
        setTimeout(() => {
          router.push("/connections");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <div className="flex flex-col items-center text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                  Processing Connection
                </h1>
                <p className="text-gray-600 font-light">{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                  {provider} Connected!
                </h1>
                <p className="text-gray-600 font-light mb-4">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to connections...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                  Connection Failed
                </h1>
                <p className="text-gray-600 font-light mb-4">{message}</p>
                <p className="text-sm text-gray-500">Redirecting to connections...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
