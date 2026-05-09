import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

const defaultTitle = `${siteName} | ホームジム実例と器具ランキング`;

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
  alternates: {
    canonical: absoluteUrl("/"),
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
