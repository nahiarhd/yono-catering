import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { id } from "@/lib/id";
import { RealtimeListener } from "@/components/realtime-listener";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: id.app.name,
  description: id.app.description,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/yono.jpg" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/yono.jpg" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/yono.jpg",
  },
  appleWebApp: {
    capable: true,
    title: id.app.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#FDC800",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <RealtimeListener />
      </body>
    </html>
  );
}