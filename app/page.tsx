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

**IMPORTANT**: Configure your Nango OAuth redirect URL to point to this frontend:

In Nango dashboard (https://app.nango.dev):
1. Go to each integration (Microsoft/Gmail)
2. Set OAuth Redirect URL to: `https://your-frontend-url.vercel.app/callback`
3. Or for local dev: `http://localhost:3000/callback`

## OAuth Flow

1. User clicks "Connect Microsoft" or "Connect Gmail"
2. Frontend stores tenant ID in localStorage
3. Frontend calls backend `/connect/start` to get Nango OAuth URL
4. User redirects to Nango for OAuth
5. After OAuth success, Nango redirects to `/callback` page
6. Callback page calls backend `/nango/oauth/callback` to save connection
7. User redirects back to main page

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

import { ConnectCard } from "@/components/connect-card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <ConnectCard />
    </main>
  );
}
