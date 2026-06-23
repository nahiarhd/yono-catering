import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { id } from "@/lib/id";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: id.app.name,
  description: id.app.description,
  manifest: "/manifest.json",
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}