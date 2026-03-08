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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
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
