import type { Metadata, Viewport } from "next";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        <ClientProviders>
          <ToastProvider>
            <AppLayoutShell>{children}</AppLayoutShell>
            <ScrollToTop />
          </ToastProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
