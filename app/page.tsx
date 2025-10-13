/*
# Nango Connect Frontend

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```

3. Run development server:
   ```
   npm run dev
   ```

   Open http://localhost:3000

## Build & Deploy

Build for production:
```
npm run build
npm start
```

Deploy to Vercel:
```
vercel
```

Make sure to set the `NEXT_PUBLIC_BACKEND_URL` environment variable in Vercel project settings.

## Nango Configuration

Backend handles Nango configuration. The OAuth redirect URL is set to:
- Production: `https://connectorfrontend.vercel.app`
- The backend appends query params: `?connectionId=TENANT&providerConfigKey=PROVIDER`

## OAuth Flow

1. User clicks "Connect Microsoft" or "Connect Gmail"
2. Frontend calls backend `/connect/start` to get Nango OAuth URL
3. User redirects to Nango for OAuth
4. After OAuth success, Nango redirects to home page with query params
5. Frontend detects params and calls backend `/nango/oauth/callback`
6. Connection saved and user sees success toast

## Backend API Endpoints

- GET /connect/start?provider=microsoft|gmail&tenantId=TENANT
  Returns: { auth_url: string, provider: string, tenant_id: string }
- POST /nango/oauth/callback
  Body: { tenantId: string, providerConfigKey: string, connectionId: string }
- GET /status?tenantId=TENANT
  Returns: { tenant_id: string, providers: { outlook: {...}, gmail: {...} } }
- GET /sync/once/outlook?tenantId=TENANT
- GET /sync/once/gmail?tenantId=TENANT

## Features

- Connect Microsoft and Gmail accounts via Nango
- OAuth callback handling with automatic backend registration
- View connection status
- Trigger manual syncs
- Toast notifications for all actions
*/

"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConnectCard } from "@/components/connect-card";
import { handleOAuthCallback } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function processOAuthCallback() {
      const connectionId = searchParams.get("connectionId");
      const providerConfigKey = searchParams.get("providerConfigKey");

      if (connectionId && providerConfigKey) {
        try {
          // Call backend to save the connection
          await handleOAuthCallback({
            connectionId,
            providerConfigKey,
          });

          // Check if opened in popup window
          if (window.opener) {
            // Send success message to parent window
            window.opener.postMessage(
              {
                type: "oauth-success",
                provider: providerConfigKey,
              },
              window.location.origin
            );
            // Close popup after short delay
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // Not in popup, show toast and clean URL
            toast({
              title: "Connection Successful",
              description: `${providerConfigKey} connected successfully!`,
            });
            router.replace("/");
          }
        } catch (error) {
          if (window.opener) {
            // In popup, send error to parent
            window.opener.postMessage(
              {
                type: "oauth-error",
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to save connection",
              },
              window.location.origin
            );
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            toast({
              variant: "destructive",
              title: "Connection Failed",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to save connection",
            });
            router.replace("/");
          }
        }
      }
    }

    processOAuthCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ConnectCard />;
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <Suspense fallback={<ConnectCard />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
