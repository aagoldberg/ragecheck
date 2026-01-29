export interface ClearviewStoryShareInput {
  topic: string;
  leftViewpoint?: string;
  rightViewpoint?: string;
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

  const xText =
    leftSentence && rightSentence
      ? `Left sees: ${leftSentence} Right sees: ${rightSentence}\n\nThe full breakdown:`
      : `${story.topic}\n\nSee how Left, Right, and Center frame this differently:`;

  const blueskyText = `This story looks different depending on where you read it.\n\n${story.topic}\n\n${url}`;

  const nativeText = `${story.topic} - See how Left, Right, and Center frame this differently.\n\n${url}`;

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
  const xText = `Today's news, minus the spin. ${storyCount} stories analyzed from Left, Center, and Right.`;

  const blueskyText = `ClearView shows the same news from every angle. Today: ${storyCount} stories.\n\n${url}`;

  const nativeText = `Today's news analyzed from Left, Center, and Right. ${storyCount} stories without the spin.\n\n${url}`;

  return {
    xText,
    blueskyText,
    nativeText,
    nativeTitle: "ClearView Daily Briefing",
  };
}
