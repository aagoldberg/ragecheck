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
  openGraph: {
    title: "RageCheck - Detect Outrage Bait Patterns",
    description: "Analyze articles and social posts for manipulative language patterns, fear-mongering, and engagement bait.",
    type: "website",
    siteName: "RageCheck",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
