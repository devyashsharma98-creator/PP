import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
} from "next/font/google";
import Script from "next/script";
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


export const metadata: Metadata = {
  metadataBase: new URL("https://pragyapravah.org"),
  title: "Pragya Pravah - Bhopal Vibhag",
  description: "Pragya Pravah Management System - Bhopal Vibhag",
  applicationName: "Pragya Pravah",
  manifest: "/manifest.json",
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg",
    },
  keywords: ["Pragya Pravah", "Bhopal", "cultural organization", "India"],
  authors: [{ name: "Pragya Pravah Bhopal Vibhag" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Pragya Pravah",
  },
  twitter: {
    card: "summary_large_image",
    site: "@PragyaPravah",
  },
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
      className={`scroll-smooth ${plexSans.variable} ${plexSansDevanagari.variable}`}
    >
      <body className="font-body antialiased selection:bg-primary/20 selection:text-primary">
        {/* Unregister stale service workers before hydration to prevent cached HTML mismatches */}
        <Script
          id="unregister-sw"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    return Promise.all(regs.map(function(r) { return r.unregister(); }));
                  }).then(function() {
                    // Only reload if we actually unregistered something
                    if (navigator.serviceWorker.controller) {
                      window.location.reload();
                    }
                  });
                }
              })();
            `,
          }}
        />
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
