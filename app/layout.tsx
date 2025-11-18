"use client";

import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });
const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"]
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      height: 'calc(100vh - 12px)',
      overflow: 'hidden',
      position: 'relative',
      borderTopRightRadius: '16px'
    }}>
      {children}
    </div>
  );
}

function BodyContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const bodyStyle: React.CSSProperties = isLoginPage
    ? {}
    : { backgroundColor: '#30465C', padding: '12px 12px 0 0', margin: 0, height: '100vh', overflow: 'hidden', boxSizing: 'border-box' as const };

  return (
    <body className={inter.className} style={bodyStyle}>
      {children}
    </body>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <AuthProvider>
        <BodyContent>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </BodyContent>
      </AuthProvider>
    </html>
  );
}
