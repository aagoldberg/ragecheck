import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DefenseCheck by RageCheck - Defensive Rhetoric Analyzer",
  description: "Analyze any text for defensive rhetoric patterns — denial, deflection, projection, rationalization, and more. One plausible reading, not a diagnosis.",
  openGraph: {
    title: "DefenseCheck - Analyze Defensive Rhetoric Patterns",
    description: "Paste any text and see defensive communication patterns identified with evidence. One plausible reading, not a diagnosis.",
    images: [
      {
        url: "/api/og/defensecheck",
        width: 1200,
        height: 630,
        alt: "DefenseCheck by RageCheck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DefenseCheck - Analyze Defensive Rhetoric Patterns",
    description: "Paste any text and see defensive communication patterns identified with evidence. One plausible reading, not a diagnosis.",
    images: ["/api/og/defensecheck"],
  },
};

export default function DefenseCheckLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
