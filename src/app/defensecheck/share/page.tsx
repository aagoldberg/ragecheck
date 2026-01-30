import { Metadata } from "next";
import { getDefenseCheckAnalysisById } from "@/lib/db";
import { ClientRedirect } from "@/components/ClientRedirect";
import { CATEGORY_META, DefenseCategory } from "@/lib/defensecheck/types";

interface DefenseCheckSharePageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: DefenseCheckSharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const analysisId = params.id;

  if (!analysisId) {
    return fallbackMetadata();
  }

  try {
    const row = await getDefenseCheckAnalysisById(analysisId);

    if (!row) {
      return fallbackMetadata();
    }

    const result = row.result as {
      patterns?: { category: string; severity: number }[];
      scoreLabel?: string;
    };
    const score = row.score;
    const scoreLabel = result.scoreLabel || "Analysis";
    const patterns = result.patterns || [];

    const ogTitle = `DefenseCheck: ${scoreLabel} (${score}/100)`;
    const topPattern = patterns[0];
    const ogDescription = topPattern
      ? `Top pattern: ${CATEGORY_META[topPattern.category as DefenseCategory]?.label || topPattern.category}. Analyze any text for defensive rhetoric patterns.`
      : "Analyze any text for defensive rhetoric patterns — denial, deflection, projection, and more.";

    // Build OG image URL with category data
    const imageParams = new URLSearchParams({
      score: String(score),
      label: scoreLabel,
    });

    patterns.slice(0, 3).forEach((p, i) => {
      imageParams.set(`cat${i + 1}`, p.category);
      imageParams.set(`sev${i + 1}`, String(p.severity));
    });

    const ogImageUrl = `/api/og/defensecheck?${imageParams.toString()}`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: "website",
        siteName: "DefenseCheck",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: ogTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImageUrl],
      },
    };
  } catch {
    return fallbackMetadata();
  }
}

function fallbackMetadata(): Metadata {
  const ogTitle = "DefenseCheck - Defensive Rhetoric Analyzer";
  const ogDescription =
    "Analyze any text for defensive rhetoric patterns — denial, deflection, projection, and more. One plausible reading, not a diagnosis.";

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      siteName: "DefenseCheck",
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
      title: ogTitle,
      description: ogDescription,
      images: ["/api/og/defensecheck"],
    },
  };
}

export default async function DefenseCheckSharePage({
  searchParams,
}: DefenseCheckSharePageProps) {
  const params = await searchParams;
  const analysisId = params.id;
  let redirectUrl = "/defensecheck";

  if (analysisId) {
    try {
      const row = await getDefenseCheckAnalysisById(analysisId);
      if (row) {
        // Analysis exists — redirect to main page
        redirectUrl = "/defensecheck";
      }
    } catch {
      // Analysis expired or missing — redirect to generic page
    }
  }

  return <ClientRedirect url={redirectUrl} />;
}
