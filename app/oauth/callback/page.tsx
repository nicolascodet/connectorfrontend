"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus("success");

      // Notify parent window (if opened as popup)
      if (window.opener) {
        window.opener.postMessage({ type: "oauth-success" }, window.location.origin);
        // Close popup after notifying parent
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        // If not a popup, redirect to connections page
        setTimeout(() => {
          router.push("/connections");
        }, 2000);
      }
    };

    handleCallback();
  }, [router]);

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
                <p className="text-gray-600 font-light">Please wait while we complete your OAuth connection...</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-normal text-gray-900 mb-2">
                  Connected Successfully!
                </h1>
                <p className="text-gray-600 font-light mb-4">Your connection has been established.</p>
                <p className="text-sm text-gray-500">
                  {window.opener ? "You can close this window..." : "Redirecting to connections..."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
