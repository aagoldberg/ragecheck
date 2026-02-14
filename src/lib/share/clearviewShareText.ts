export interface ClearviewStoryShareInput {
  topic: string;
  leftViewpoint?: string;
  rightViewpoint?: string;
  moralFoundationsInPlay?: string[];
  sharedValues?: string[];
}

export interface ClearviewShareTexts {
  xText: string;
  blueskyText: string;
  nativeText: string;
  nativeTitle: string;
}

function getFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text.trim();
}

const FOUNDATION_LABELS: Record<string, string> = {
  care: "care",
  fairness: "fairness",
  loyalty: "loyalty",
  authority: "authority",
  sanctity: "sanctity",
  liberty: "liberty",
};

export function getClearviewStoryShareText(
  story: ClearviewStoryShareInput,
  url: string
): ClearviewShareTexts {
  const leftSentence = story.leftViewpoint
    ? getFirstSentence(story.leftViewpoint)
    : "";
  const rightSentence = story.rightViewpoint
    ? getFirstSentence(story.rightViewpoint)
    : "";

  // Use moral foundations framing when available
  const foundations = story.moralFoundationsInPlay || [];
  const hasFoundations = foundations.length >= 2;

  let xText: string;
  if (hasFoundations) {
    const labels = foundations.slice(0, 2).map(f => FOUNDATION_LABELS[f] || f);
    xText = `A ${labels[0]} vs. ${labels[1]} debate: ${story.topic}\n\n${story.sharedValues?.[0] ? `Both sides agree: ${story.sharedValues[0]}` : "See what both sides actually share."}`;
  } else if (leftSentence && rightSentence) {
    xText = `Left sees: ${leftSentence} Right sees: ${rightSentence}\n\nThe full breakdown:`;
  } else {
    xText = `${story.topic}\n\nSee how different values shape the debate:`;
  }

  const blueskyText = hasFoundations
    ? `Same story, different values. ${story.topic}\n\n${url}`
    : `This story looks different depending on where you read it.\n\n${story.topic}\n\n${url}`;

  const nativeText = hasFoundations
    ? `${story.topic} - See the different values driving this debate.\n\n${url}`
    : `${story.topic} - See how Left, Right, and Center frame this differently.\n\n${url}`;

  return {
    xText,
    blueskyText,
    nativeText,
    nativeTitle: `ClearView: ${story.topic}`,
  };
}

export function getClearviewBriefingShareText(
  storyCount: number,
  url: string
): ClearviewShareTexts {
  const xText = `Today's news, minus the spin. ${storyCount} stories analyzed through moral foundations, not tribal teams.`;

  const blueskyText = `ClearView: understand WHY people disagree, not just WHO. Today: ${storyCount} stories.\n\n${url}`;

  const nativeText = `Today's news analyzed through values and moral foundations. ${storyCount} stories without the spin.\n\n${url}`;

  return {
    xText,
    blueskyText,
    nativeText,
    nativeTitle: "ClearView Daily Briefing",
  };
}
