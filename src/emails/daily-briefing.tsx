import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Source {
  name: string;
  lean: string;
  title: string;
  url: string;
  framing: string;
}

interface Perspective {
  lean: string;
  viewpoint: string;
}

interface ExpertConsensus {
  type: string;
  exists: boolean;
  statement?: string;
  confidenceLevel?: string;
}

interface WhyItMatters {
  left: {
    coreValue: string;
    motivation: string;
  };
  right: {
    coreValue: string;
    motivation: string;
  };
  bottomLine: string;
}

interface Story {
  id: string;
  topic: string;
  summary: string;
  whatHappened: string;
  sources: Source[];
  perspectives: Perspective[];
  keyTakeaway: string;
  expertConsensus?: ExpertConsensus;
  debateType?: string;
  commonGround?: string[];
  whyItMatters?: WhyItMatters;
}

interface DailyBriefingEmailProps {
  stories: Story[];
  date: string;
}

function getLeanColor(lean: string): string {
  switch (lean) {
    case "Far Left":
      return "#1d4ed8";
    case "Left":
      return "#3b82f6";
    case "Center":
      return "#6b7280";
    case "Right":
      return "#ef4444";
    case "Far Right":
      return "#b91c1c";
    default:
      return "#6b7280";
  }
}

function getLeanEmoji(lean: string): string {
  switch (lean) {
    case "Far Left":
      return "🔵";
    case "Left":
      return "🔵";
    case "Center":
      return "⚪";
    case "Right":
      return "🔴";
    case "Far Right":
      return "🔴";
    default:
      return "⚪";
  }
}

export default function DailyBriefingEmail({
  stories,
  date,
}: DailyBriefingEmailProps) {
  const previewText = `ClearView Daily: ${stories.slice(0, 2).map(s => s.topic).join(", ")}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>ClearView</Heading>
            <Text style={tagline}>Cut through the noise. See the story.</Text>
            <Text style={dateText}>{date}</Text>
          </Section>

          <Hr style={divider} />

          {/* Intro */}
          <Section style={intro}>
            <Text style={introText}>
              Today&apos;s top {stories.length} stories, analyzed across the political spectrum.
              We show you what happened, how it&apos;s being framed, and why each side cares.
            </Text>
          </Section>

          {/* Stories */}
          {stories.map((story, index) => (
            <Section key={story.id} style={storySection}>
              <Heading as="h2" style={storyTitle}>
                {index + 1}. {story.topic}
              </Heading>

              {/* What Happened */}
              <Text style={sectionLabel}>What Actually Happened</Text>
              <Text style={storyText}>{story.whatHappened || story.summary}</Text>

              {/* Key Takeaway */}
              <Section style={takeawayBox}>
                <Text style={takeawayText}>
                  <strong>Key Takeaway:</strong> {story.keyTakeaway}
                </Text>
              </Section>

              {/* Expert Consensus */}
              {story.expertConsensus?.exists && (
                <Section style={consensusBox}>
                  <Text style={consensusText}>
                    <strong>Expert Consensus ({story.expertConsensus.type}):</strong>{" "}
                    {story.expertConsensus.statement}
                  </Text>
                </Section>
              )}

              {/* Why It Matters */}
              {story.whyItMatters && (
                <Section style={whyItMattersSection}>
                  <Text style={sectionLabel}>Why Each Side Cares</Text>
                  <Section style={perspectiveRow}>
                    <Section style={perspectiveBox}>
                      <Text style={perspectiveLabel}>🔵 Left</Text>
                      <Text style={perspectiveText}>
                        <strong>{story.whyItMatters.left.coreValue}:</strong>{" "}
                        {story.whyItMatters.left.motivation}
                      </Text>
                    </Section>
                    <Section style={perspectiveBox}>
                      <Text style={perspectiveLabel}>🔴 Right</Text>
                      <Text style={perspectiveText}>
                        <strong>{story.whyItMatters.right.coreValue}:</strong>{" "}
                        {story.whyItMatters.right.motivation}
                      </Text>
                    </Section>
                  </Section>
                  <Text style={bottomLineText}>
                    <strong>Bottom Line:</strong> {story.whyItMatters.bottomLine}
                  </Text>
                </Section>
              )}

              {/* How It's Being Covered */}
              <Text style={sectionLabel}>How It&apos;s Being Covered</Text>
              {story.sources.map((source, i) => (
                <Section key={i} style={sourceItem}>
                  <Text style={sourceHeader}>
                    {getLeanEmoji(source.lean)}{" "}
                    <span style={{ color: getLeanColor(source.lean), fontWeight: 600 }}>
                      {source.name}
                    </span>{" "}
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>({source.lean})</span>
                  </Text>
                  <Link href={source.url} style={sourceTitle}>
                    {source.title}
                  </Link>
                  <Text style={framingText}>
                    <em>Framing:</em> {source.framing}
                  </Text>
                </Section>
              ))}

              {/* Common Ground */}
              {story.commonGround && story.commonGround.length > 0 && (
                <Section style={commonGroundBox}>
                  <Text style={commonGroundLabel}>Common Ground</Text>
                  {story.commonGround.map((point, i) => (
                    <Text key={i} style={commonGroundText}>• {point}</Text>
                  ))}
                </Section>
              )}

              {index < stories.length - 1 && <Hr style={storyDivider} />}
            </Section>
          ))}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://ragecheck.com/clearview" style={footerLink}>
                Read full analysis on ClearView
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href="https://ragecheck.com" style={footerLink}>
                Check any content for rage-bait with RageCheck
              </Link>
            </Text>
            <Text style={unsubscribeText}>
              <Link href="{{unsubscribe_url}}" style={unsubscribeLink}>
                Unsubscribe
              </Link>{" "}
              from daily briefings
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 48px 0",
  textAlign: "center" as const,
};

const logo = {
  color: "#7c3aed",
  fontSize: "32px",
  fontWeight: "bold" as const,
  margin: "0",
};

const tagline = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "4px 0 0",
};

const dateText = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "8px 0 0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 48px",
};

const intro = {
  padding: "0 48px",
};

const introText = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "24px",
};

const storySection = {
  padding: "0 48px",
};

const storyTitle = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "600" as const,
  margin: "24px 0 16px",
};

const sectionLabel = {
  color: "#7c3aed",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "16px 0 8px",
};

const storyText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const takeawayBox = {
  backgroundColor: "#faf5ff",
  borderLeft: "4px solid #7c3aed",
  padding: "12px 16px",
  margin: "16px 0",
};

const takeawayText = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const consensusBox = {
  backgroundColor: "#ecfdf5",
  borderLeft: "4px solid #10b981",
  padding: "12px 16px",
  margin: "16px 0",
};

const consensusText = {
  color: "#065f46",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const whyItMattersSection = {
  margin: "16px 0",
};

const perspectiveRow = {
  display: "flex" as const,
  gap: "16px",
};

const perspectiveBox = {
  flex: "1",
  backgroundColor: "#f9fafb",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "8px",
};

const perspectiveLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  margin: "0 0 4px",
};

const perspectiveText = {
  color: "#4b5563",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const bottomLineText = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "500" as const,
  lineHeight: "22px",
  margin: "8px 0 0",
};

const sourceItem = {
  marginBottom: "16px",
};

const sourceHeader = {
  fontSize: "14px",
  margin: "0 0 4px",
};

const sourceTitle = {
  color: "#2563eb",
  fontSize: "14px",
  textDecoration: "none",
  display: "block",
  marginBottom: "4px",
};

const framingText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const commonGroundBox = {
  backgroundColor: "#f0fdf4",
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "16px 0",
};

const commonGroundLabel = {
  color: "#166534",
  fontSize: "12px",
  fontWeight: "600" as const,
  margin: "0 0 8px",
};

const commonGroundText = {
  color: "#166534",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const storyDivider = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  padding: "0 48px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "8px 0",
};

const footerLink = {
  color: "#7c3aed",
  textDecoration: "none",
};

const unsubscribeText = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "24px 0 0",
};

const unsubscribeLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};
