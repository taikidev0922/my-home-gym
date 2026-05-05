import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { absoluteUrl, baseSeoKeywords, defaultSeoDescription, rankingSeoKeywords, siteName, siteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ホームジム実例と用品ランキング`,
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "fitness",
  keywords: [...baseSeoKeywords, ...rankingSeoKeywords],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `${siteName} | ホームジム実例と用品ランキング`,
    description: defaultSeoDescription,
    url: absoluteUrl("/"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${siteName} | ホームジム実例と用品ランキング`,
    description: defaultSeoDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
