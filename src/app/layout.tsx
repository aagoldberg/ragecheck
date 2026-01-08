import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RageCheck - Detect Outrage Bait Patterns",
  description: "A pattern detector for manipulative outrage framing in media. Analyze articles for loaded language, us-vs-them framing, and engagement bait.",
  metadataBase: new URL("https://ragecheck.com"),
  keywords: ["outrage bait", "media analysis", "manipulation detection", "fake news", "clickbait detector", "loaded language", "media literacy", "news analyzer"],
  authors: [{ name: "RageCheck" }],
  creator: "RageCheck",
  publisher: "RageCheck",
  alternates: {
    canonical: "https://ragecheck.com",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "RageCheck - Detect Outrage Bait Patterns",
    description: "Analyze articles and social posts for manipulative language patterns, fear-mongering, and engagement bait.",
    type: "website",
    siteName: "RageCheck",
    locale: "en_US",
    url: "https://ragecheck.com",
    images: [
      {
        url: "/api/og/default",
        width: 1200,
        height: 630,
        alt: "RageCheck - Outrage Bait Detection Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RageCheck - Detect Outrage Bait Patterns",
    description: "Analyze articles and social posts for manipulative language patterns, fear-mongering, and engagement bait.",
    images: ["/api/og/default"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-verification-code",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RageCheck",
  description: "A pattern detector for manipulative outrage framing in media. Analyze articles for loaded language, us-vs-them framing, and engagement bait.",
  url: "https://ragecheck.com",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "RageCheck",
    url: "https://ragecheck.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
