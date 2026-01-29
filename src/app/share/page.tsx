import { Metadata } from "next";
import { ClientRedirect } from "@/components/ClientRedirect";

interface SharePageProps {
  searchParams: Promise<{
    url?: string;
    score?: string;
    domain?: string;
    title?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const score = params.score ? parseInt(params.score) : 0;
  const domain = params.domain || "Unknown";
  const title = params.title || "Content Analysis";

  const getLabel = (s: number) => {
    if (s <= 33) return "Low";
    if (s <= 66) return "Medium";
    return "High";
  };

  const label = getLabel(score);
  const emoji = score > 66 ? "🔴" : score > 33 ? "🟡" : "🟢";

  const ogTitle = `${emoji} RageCheck Score: ${score}/100 (${label})`;
  const ogDescription = `Analysis of ${domain}: This content scored ${score}/100 for manipulative patterns. ${
    score > 66
      ? "High levels of outrage bait detected."
      : score > 33
      ? "Some concerning patterns found."
      : "Minimal manipulation signals."
  }`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      siteName: "RageCheck",
      images: [
        {
          url: `/api/og?score=${score}&domain=${encodeURIComponent(domain)}&title=${encodeURIComponent(title)}&v=1`,
          width: 1200,
          height: 630,
          alt: `RageCheck score: ${score}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [`/api/og?score=${score}&domain=${encodeURIComponent(domain)}&title=${encodeURIComponent(title)}&v=1`],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;

  // Build redirect URL -- crawlers will read OG tags from the HTML,
  // humans get redirected client-side via JavaScript
  const redirectUrl = params.url
    ? `/?url=${encodeURIComponent(params.url)}`
    : "/";

  return <ClientRedirect url={redirectUrl} />;
}
