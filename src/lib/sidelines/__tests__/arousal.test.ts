/**
 * Arousal Scorer Tests
 *
 * Run with: npx vitest run src/lib/sidelines/__tests__/arousal.test.ts
 * (requires vitest: npm i -D vitest)
 */

import { describe, it, expect } from "vitest";
import { computeArousal, computeArousalBatch } from "../arousal";

describe("computeArousal", () => {
  it("returns 0 for empty text", () => {
    const result = computeArousal("");
    expect(result.score).toBe(0);
    expect(result.breakdown.emotionAngerFearDisgust).toBe(0);
  });

  it("returns 0 for whitespace-only text", () => {
    const result = computeArousal("   \n\t  ");
    expect(result.score).toBe(0);
  });

  it("scores neutral text low (< 0.3)", () => {
    const result = computeArousal(
      "The committee met today to discuss the budget proposal for next year."
    );
    expect(result.score).toBeLessThan(0.3);
  });

  it("scores calm factual reporting low", () => {
    const result = computeArousal(
      "The senator introduced a bill that would modify existing regulations on emissions standards."
    );
    expect(result.score).toBeLessThan(0.3);
  });

  it("scores ragebait text high (> 0.5)", () => {
    const result = computeArousal(
      "These DISGUSTING traitors are DESTROYING our country! They must be stopped NOW before it's too late! Wake up people!!!"
    );
    expect(result.score).toBeGreaterThan(0.5);
  });

  it("scores dehumanizing text high", () => {
    const result = computeArousal(
      "These vermin are parasites poisoning everything they touch. They're subhuman filth."
    );
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.breakdown.dehumanization).toBeGreaterThan(0);
    expect(result.breakdown.purityContamination).toBeGreaterThan(0);
  });

  it("scores moral condemnation text", () => {
    const result = computeArousal(
      "These corrupt traitors committed treason. They are evil and wicked beyond redemption."
    );
    expect(result.breakdown.moralJudgment).toBeGreaterThan(0);
  });

  it("scores urgent language", () => {
    const result = computeArousal(
      "BREAKING: This is urgent! Act now before it's too late! Share this immediately!"
    );
    expect(result.breakdown.urgency).toBeGreaterThan(0);
  });

  it("scores absolutist language", () => {
    const result = computeArousal(
      "Everyone knows this is always the case. There is absolutely no alternative, period."
    );
    expect(result.breakdown.absolutist).toBeGreaterThan(0);
  });

  it("breakdown components are between 0 and 1", () => {
    const texts = [
      "Normal text about weather",
      "FURIOUS OUTRAGED DISGUSTING ATTACK!!!",
      "They are vermin parasites destroying everything",
    ];
    for (const text of texts) {
      const result = computeArousal(text);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      for (const val of Object.values(result.breakdown)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it("provides ALL CAPS boost", () => {
    const lowercase = computeArousal("this is outrageous and terrible");
    const uppercase = computeArousal("THIS IS OUTRAGEOUS AND TERRIBLE");
    expect(uppercase.score).toBeGreaterThanOrEqual(lowercase.score);
  });

  it("provides punctuation boost", () => {
    const noPunct = computeArousal("This is outrageous");
    const withPunct = computeArousal("This is outrageous!!!!!!");
    expect(withPunct.score).toBeGreaterThanOrEqual(noPunct.score);
  });
});

describe("computeArousalBatch", () => {
  it("returns correct number of results", () => {
    const texts = ["hello", "world", "test"];
    const results = computeArousalBatch(texts);
    expect(results).toHaveLength(3);
  });

  it("matches individual computeArousal results", () => {
    const texts = [
      "Normal text",
      "FURIOUS AND OUTRAGED!!!",
    ];
    const batch = computeArousalBatch(texts);
    for (let i = 0; i < texts.length; i++) {
      const individual = computeArousal(texts[i]);
      expect(batch[i].score).toBe(individual.score);
    }
  });
});
