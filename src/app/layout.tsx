import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  IBM_Plex_Serif,
} from "next/font/google";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import { ClientProviders } from "@/components/ClientProviders";
import { ToastProvider } from "@/components/ToastProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ui-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexSansDevanagari = IBM_Plex_Sans_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-ui-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ui-serif",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pragya Pravah - Bhopal Vibhag",
  description: "Pragya Pravah Management System - Bhopal Vibhag",
  applicationName: "Pragya Pravah",
  appleWebApp: {
    capable: true,
    title: "Pragya Pravah",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${plexSans.variable} ${plexSansDevanagari.variable} ${plexSerif.variable}`}
    >
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
