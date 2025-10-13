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

## Backend API Endpoints

The app expects these backend endpoints:
- GET /connect/start?provider=microsoft|gmail&tenantId=TENANT
- GET /status?tenantId=TENANT
- GET /sync/once/outlook?tenantId=TENANT
- GET /sync/once/gmail?tenantId=TENANT

## Features

- Connect Microsoft and Gmail accounts via Nango
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
