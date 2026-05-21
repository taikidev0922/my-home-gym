import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import {
  absoluteUrl,
  baseSeoKeywords,
  defaultSeoDescription,
  rankingSeoKeywords,
  siteAuthorName,
  siteName,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = `${siteName} | ホームジム実例と器具ランキング`;
const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl("/brand/favicon-512.webp"),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    alternateName: siteAuthorName,
    url: siteUrl,
    inLanguage: "ja-JP",
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/favicon-512.webp"),
      },
    },
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "fitness",
  keywords: [...baseSeoKeywords, ...rankingSeoKeywords],
  icons: {
    icon: [
      { url: "/favicon.webp", type: "image/webp" },
      { url: "/favicon-512.webp", sizes: "512x512", type: "image/webp" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon.webp", type: "image/webp" },
    ],
    shortcut: "/favicon.webp",
    apple: [{ url: "/apple-touch-icon.webp", sizes: "180x180", type: "image/webp" }],
  },
  alternates: {
    canonical: absoluteUrl("/"),
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
    },
  },
  openGraph: {
    title: defaultTitle,
    description: defaultSeoDescription,
    url: absoluteUrl("/"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: defaultTitle,
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
      <body>
        {children}
        <Script id="site-json-ld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(siteJsonLd).replace(/</g, "\\u003c")}
        </Script>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-41RHRTCWKW" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-41RHRTCWKW');
          `}
        </Script>
      </body>
    </html>
  );
}
