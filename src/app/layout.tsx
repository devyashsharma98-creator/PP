import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import { ClientProviders } from "@/components/ClientProviders";
import { ToastProvider } from "@/components/ToastProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pragya Pravah - Bhopal Vibhag",
  description: "Pragya Pravah Management System - Bhopal Vibhag",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const NEON_SESSION_COOKIE = "pp_neon_session";

async function resolveRootHomeMode() {
  const store = await cookies();
  const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "pp_session";
  const session =
    store.get(sessionCookieName)?.value ?? store.get(NEON_SESSION_COOKIE)?.value;
  const demoFallback =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK === "true";

  return session || demoFallback ? "internal" : "public";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootHomeMode = await resolveRootHomeMode();

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        <ClientProviders>
          <ToastProvider>
            <AppLayoutShell rootHomeMode={rootHomeMode}>{children}</AppLayoutShell>
            <ScrollToTop />
          </ToastProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
