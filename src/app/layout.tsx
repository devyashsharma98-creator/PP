import type { Metadata, Viewport } from "next";
import {
  Anek_Devanagari,
  Fraunces,
  Inter,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { AppLayoutShell } from "@/components/AppLayoutShell";
import { ClientProviders } from "@/components/ClientProviders";
import { ToastProvider } from "@/components/ToastProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-ui-fraunces",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-ui-noto-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const anekDevanagari = Anek_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-ui-anek-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${inter.variable} ${fraunces.variable} ${notoSansDevanagari.variable} ${anekDevanagari.variable}`}
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
