"use client";

import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const inter = Inter({ subsets: ["latin"] });
const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"]
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#24374A', padding: '12px' }}>
        <AuthProvider>
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 24px)' }}>
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
