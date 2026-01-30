import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SideLines by RageCheck - Political Discourse Dynamics",
  description: "Measure the sporting dynamics of political discourse. Track base activation, cross-cluster contact, bridge churn, and middle attrition in real-time social network subgraphs.",
  openGraph: {
    title: "SideLines - Political Discourse Dynamics",
    description: "Measuring how political communities interact, polarize, and lose their middle ground.",
  },
};

export default function SideLinesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
