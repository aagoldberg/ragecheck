import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stance by RageCheck - Full Rhetorical Analysis",
  description: "Deep rhetorical analysis of any text — posture, defense patterns, persuasion techniques, predicted effects, and reader interventions.",
  openGraph: {
    title: "Stance - Full Rhetorical Analysis",
    description: "8-stage rhetorical analysis: posture, defense, persuasion, predicted effects, and actionable interventions.",
    images: [{ url: "/api/og/stance", width: 1200, height: 630, alt: "Stance by RageCheck" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stance - Full Rhetorical Analysis",
    description: "8-stage rhetorical analysis: posture, defense, persuasion, predicted effects, and actionable interventions.",
    images: ["/api/og/stance"],
  },
};

export default function StanceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
