/**
 * Test samples for the 5-bar ragebait model
 *
 * 15 samples:
 * - 5 ragebait (should score >= 70)
 * - 5 borderline (should score 45-69)
 * - 5 not_ragebait (should score < 45)
 *
 * To run: npx tsx src/lib/model/__tests__/analyze.test.ts
 */

import { analyze } from "../scoring";
import { Label } from "../types";

interface TestCase {
  name: string;
  text: string;
  expectedLabel: Label;
  notes?: string;
}

// 5 Ragebait samples (should score >= 70)
const RAGEBAIT_SAMPLES: TestCase[] = [
  {
    name: "Political outrage post",
    text: "BREAKING: These corrupt traitors are DESTROYING our country! They want to take EVERYTHING from you. How is this allowed?! Wake up people - they won't stop until we're all slaves. Share this before they delete it!!!",
    expectedLabel: "ragebait",
    notes: "High arousal, enemy construction, moral condemnation, call to conflict",
  },
  {
    name: "Dehumanizing rant",
    text: "The vermin on the left are infecting our schools with their disgusting ideology. Every single one of them is evil. They're coming for your children. This is a war and we must fight back NOW or lose everything forever.",
    expectedLabel: "ragebait",
    notes: "Strong dehumanization, purity language, threat framing",
  },
  {
    name: "Rage engagement bait",
    text: "Imagine thinking these criminals deserve sympathy. You can't make this up. Let that sink in. If you support this, you're part of the problem. Tell me you're brainwashed without telling me you're brainwashed.",
    expectedLabel: "ragebait",
    notes: "Heavy call-to-conflict templates, second-person provocation",
  },
  {
    name: "Moral panic post",
    text: "ABSOLUTELY DISGUSTING! The elites are poisoning our children while the mainstream media covers it up. They're all traitors who sold out to the globalists. Everyone knows the truth but no one is talking about it!",
    expectedLabel: "ragebait",
    notes: "Caps, moral judgment, conspiracy framing, scapegoating",
  },
  {
    name: "Simplistic outrage",
    text: "The left always lies. Always. Never trust them. Either you're with us or you're against America. There's only one choice. This is why everything is falling apart - because of THEM and their radical agenda to destroy us.",
    expectedLabel: "ragebait",
    notes: "Absolutist terms, false dilemma, enemy construction",
  },
];

// 5 Borderline samples (should score 45-69)
const BORDERLINE_SAMPLES: TestCase[] = [
  {
    name: "Heated but not extreme",
    text: "I'm really frustrated with how politicians keep making empty promises. They seem more interested in staying in power than actually helping people. Something needs to change.",
    expectedLabel: "borderline",
    notes: "Some arousal and critique but not extreme",
  },
  {
    name: "Partisan commentary",
    text: "The other side just doesn't get it. Their policies have clearly failed, and yet they keep pushing the same tired ideas. When will they learn? We need real solutions.",
    expectedLabel: "borderline",
    notes: "Us-vs-them framing but moderate tone",
  },
  {
    name: "Emotional advocacy",
    text: "How can anyone look at this situation and not be outraged? Children are suffering while bureaucrats do nothing. We must demand action NOW. Share this to spread awareness!",
    expectedLabel: "borderline",
    notes: "Urgency and call to action but legitimate concern",
  },
  {
    name: "Critical opinion piece",
    text: "The corruption in our institutions is undeniable. Officials who were supposed to protect us have betrayed the public trust. This pattern of failure is shameful and needs to end.",
    expectedLabel: "borderline",
    notes: "Strong language but analytical framing",
  },
  {
    name: "Social media debate",
    text: "Can't believe people still defend this. Obviously it's a disaster. Everyone can see what's happening except those who refuse to look. Wake up and pay attention.",
    expectedLabel: "borderline",
    notes: "Dismissive but not dehumanizing",
  },
];

// 5 Not ragebait samples (should score < 45)
const NOT_RAGEBAIT_SAMPLES: TestCase[] = [
  {
    name: "News report",
    text: "According to officials, the new policy will take effect next month. Critics argue it may increase costs, while supporters claim it will improve efficiency. The final decision is expected by Friday.",
    expectedLabel: "not_ragebait",
    notes: "Should trigger high reporting discount",
  },
  {
    name: "Academic analysis",
    text: "The study suggests that political polarization has increased over the past decade. However, researchers note that the methodology has limitations. Further analysis is needed to understand the underlying causes.",
    expectedLabel: "not_ragebait",
    notes: "Hedging, multi-perspective, analytic structure",
  },
  {
    name: "Sincere personal reflection",
    text: "I've been thinking a lot about the state of things lately. It's frustrating to see problems that seem solvable go unaddressed. I don't have all the answers, but I hope we can find a better path forward.",
    expectedLabel: "not_ragebait",
    notes: "Personal, reflective, no enemy construction",
  },
  {
    name: "Factual summary",
    text: "The company reported Q3 earnings of $2.4 billion, up 12% from last year. CEO Jane Smith stated that growth was driven by international expansion. Analysts expect continued momentum through 2024.",
    expectedLabel: "not_ragebait",
    notes: "High information density, attribution verbs",
  },
  {
    name: "Balanced opinion",
    text: "There are valid arguments on both sides of this debate. Some believe stronger regulations are needed, while others worry about overreach. Finding the right balance will require compromise and good-faith negotiation.",
    expectedLabel: "not_ragebait",
    notes: "Multi-perspective, no absolutism, balanced",
  },
];

// Test runner
function runTests() {
  console.log("\n=== RAGEBAIT MODEL TEST SUITE ===\n");

  let passed = 0;
  let failed = 0;
  const failures: { name: string; expected: string; got: string; score: number }[] = [];

  const allSamples = [
    ...RAGEBAIT_SAMPLES,
    ...BORDERLINE_SAMPLES,
    ...NOT_RAGEBAIT_SAMPLES,
  ];

  for (const sample of allSamples) {
    const result = analyze(sample.text);
    const match = result.label === sample.expectedLabel;

    if (match) {
      passed++;
      console.log(`✓ ${sample.name} (${result.bait_score}, ${result.label})`);
    } else {
      failed++;
      failures.push({
        name: sample.name,
        expected: sample.expectedLabel,
        got: result.label,
        score: result.bait_score,
      });
      console.log(`✗ ${sample.name}`);
      console.log(`  Expected: ${sample.expectedLabel}, Got: ${result.label} (score: ${result.bait_score})`);
    }

    // Check evidence exists for top bar
    const topBar = Object.entries(result.bars)
      .sort(([, a], [, b]) => b - a)[0][0];
    const hasEvidence = result.evidence[topBar as keyof typeof result.evidence]?.length > 0;
    if (!hasEvidence && result.bait_score > 30) {
      console.log(`  ⚠ Missing evidence for top bar (${topBar})`);
    }
  }

  console.log(`\n=== RESULTS: ${passed}/${allSamples.length} passed ===\n`);

  if (failures.length > 0) {
    console.log("Failures:");
    for (const f of failures) {
      console.log(`  - ${f.name}: expected ${f.expected}, got ${f.got} (score: ${f.score})`);
    }
  }

  // Additional assertions
  console.log("\n=== ADDITIONAL CHECKS ===\n");

  // Check that journalism sample gets high reporting discount
  const journalismResult = analyze(NOT_RAGEBAIT_SAMPLES[0].text);
  const journalismDiscount = journalismResult.modifiers.reporting_analysis_discount;
  console.log(`Journalism discount: ${journalismDiscount}% (should be > 30)`);
  if (journalismDiscount < 30) {
    console.log("  ⚠ Journalism sample should have higher reporting discount");
  }

  // Check that high info density sample scores well
  const factualResult = analyze(NOT_RAGEBAIT_SAMPLES[3].text);
  const infoDensity = factualResult.modifiers.information_density;
  console.log(`Factual info density: ${infoDensity}% (should be > 20)`);

  return failed === 0;
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests, RAGEBAIT_SAMPLES, BORDERLINE_SAMPLES, NOT_RAGEBAIT_SAMPLES };
