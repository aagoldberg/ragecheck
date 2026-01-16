import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClearView by RageCheck - Unbiased News Briefing",
  description: "Read today's top stories synthesized from across the political spectrum. We strip away the spin to show you what actually happened and how different sources framed it.",
  openGraph: {
    title: "ClearView - What Actually Happened. Minus the Spin.",
    description: "Daily briefing synthesized from Left, Center, and Right sources. See the core facts and the framing differences.",
    images: [
      {
        url: "/api/og/clearview?v=1",
        width: 1200,
        height: 630,
        alt: "ClearView by RageCheck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClearView - What Actually Happened. Minus the Spin.",
    description: "Daily briefing synthesized from Left, Center, and Right sources. See the core facts and the framing differences.",
    images: ["/api/og/clearview?v=1"],
  },
};

export default function ClearViewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
