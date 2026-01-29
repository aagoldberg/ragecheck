import { Metadata } from "next";
import { getClearviewStoryById } from "@/lib/db";
import { ClientRedirect } from "@/components/ClientRedirect";

interface ClearviewSharePageProps {
  searchParams: Promise<{
    story?: string;
    topic?: string;
    type?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ClearviewSharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const storyId = params.story;
  const fallbackTopic = params.topic || "Today's News";
  const isBriefing = params.type === "briefing";

  // Briefing share -- generic ClearView OG
  if (isBriefing || !storyId) {
    const ogTitle = "ClearView Daily Briefing";
    const ogDescription =
      "Today's top stories analyzed from Left, Center, and Right. See through the spin.";

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
            url: "/api/og/clearview",
            width: 1200,
            height: 630,
            alt: "ClearView Daily Briefing",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: ["/api/og/clearview"],
      },
    };
  }

  // Story-specific share -- look up story for OG data
  let ogTitle = `ClearView: ${fallbackTopic}`;
  let ogDescription = "See how Left, Right, and Center frame this story differently.";
  let ogImageUrl = "/api/og/clearview";

  try {
    const result = await getClearviewStoryById(storyId);

    if (result) {
      const { story } = result;
      ogTitle = `ClearView: ${story.topic}`;

      const leftPerspective = story.perspectives.find((p) =>
        p.lean.toLowerCase().includes("left")
      );
      const rightPerspective = story.perspectives.find((p) =>
        p.lean.toLowerCase().includes("right")
      );

      if (leftPerspective && rightPerspective) {
        const leftSnippet = leftPerspective.viewpoint.split(/[.!?]/)[0];
        const rightSnippet = rightPerspective.viewpoint.split(/[.!?]/)[0];
        ogDescription = `Left: "${leftSnippet}." Right: "${rightSnippet}."`;
      }

      // Build per-story OG image URL with display data
      const imageParams = new URLSearchParams({
        topic: story.topic,
        ...(story.debateType && { debateType: story.debateType }),
        sourceCount: String(story.sources.length),
        ...(leftPerspective && {
          leftView: leftPerspective.viewpoint.substring(0, 100),
        }),
        ...(rightPerspective && {
          rightView: rightPerspective.viewpoint.substring(0, 100),
        }),
      });
      ogImageUrl = `/api/og/clearview/story?${imageParams.toString()}`;
    }
  } catch {
    // Fall through to fallback
  }

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
}

export default async function ClearviewSharePage({ searchParams }: ClearviewSharePageProps) {
  const params = await searchParams;
  const storyId = params.story;

  // Build redirect URL -- crawlers will read OG tags from the HTML,
  // humans get redirected client-side via JavaScript
  let redirectUrl = "/clearview";

  if (storyId) {
    try {
      const result = await getClearviewStoryById(storyId);
      if (result) {
        redirectUrl = `/clearview#story-${storyId}`;
      }
    } catch {
      // Story expired -- redirect to generic ClearView
    }
  }

  return <ClientRedirect url={redirectUrl} />;
}
