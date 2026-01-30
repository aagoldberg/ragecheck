import { Metadata } from "next";
import { getStanceAnalysisById } from "@/lib/db";
import { ClientRedirect } from "@/components/ClientRedirect";
import { POSTURE_META, type Posture } from "@/lib/stance/types";

interface StanceSharePageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: StanceSharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const analysisId = params.id;

  if (!analysisId) {
    return fallbackMetadata();
  }

  try {
    const row = await getStanceAnalysisById(analysisId);

    if (!row) {
      return fallbackMetadata();
    }

    const result = row.result as {
      posture?: { primary: string };
      defense_module?: { overall_defense_score_raw: number };
      predicted_effects?: { escalation_likelihood: number; polarization_push: number };
      summary?: { primary_mode: string };
    };

    const posture = result.posture?.primary || "INQUIRY";
    const postureLabel = POSTURE_META[posture as Posture]?.label || posture;
    const defenseScore = row.defense_score;
    const escalation = result.predicted_effects?.escalation_likelihood || 0;
    const polarization = result.predicted_effects?.polarization_push || 0;
    const mode = result.summary?.primary_mode || "";

    const ogTitle = `Stance: ${postureLabel} — Defense ${defenseScore}/100`;
    const ogDescription = `8-stage rhetorical analysis. Primary posture: ${postureLabel}. Defense score: ${defenseScore}/100. Escalation: ${escalation}%. Polarization: ${polarization}%.`;

    const imageParams = new URLSearchParams({
      posture,
      defense: String(defenseScore),
      mode,
      esc: String(escalation),
      pol: String(polarization),
    });

    const ogImageUrl = `/api/og/stance?${imageParams.toString()}`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: "website",
        siteName: "Stance by RageCheck",
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
  const ogTitle = "Stance - Full Rhetorical Analysis";
  const ogDescription =
    "8-stage rhetorical analysis: posture, defense, persuasion, predicted effects, and actionable interventions.";

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      siteName: "Stance by RageCheck",
      images: [
        {
          url: "/api/og/stance",
          width: 1200,
          height: 630,
          alt: "Stance by RageCheck",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/api/og/stance"],
    },
  };
}

export default async function StanceSharePage({
  searchParams,
}: StanceSharePageProps) {
  const params = await searchParams;
  const analysisId = params.id;
  let redirectUrl = "/stance";

  if (analysisId) {
    try {
      const row = await getStanceAnalysisById(analysisId);
      if (row) {
        redirectUrl = "/stance";
      }
    } catch {
      // Analysis expired or missing — redirect to generic page
    }
  }

  return <ClientRedirect url={redirectUrl} />;
}
