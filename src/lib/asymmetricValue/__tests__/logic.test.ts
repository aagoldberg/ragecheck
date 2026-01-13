/**
 * Unit Tests for Asymmetric Value Logic
 *
 * Test cases covering:
 * 1. High heat / low evidence
 * 2. Low heat / high evidence
 * 3. Missing date context
 * 4. Missing citations
 * 5. Screenshot content type
 * 6. Template match present/absent
 * 7. High ambiguity
 * 8. Non-English post text (safe rendering)
 */

import {
  computeHeatVsEvidence,
  computeForecast,
  computeVerificationChecks,
  computeIncentiveFingerprint,
  computeNarrativeTemplate,
  computeLowRegretAction,
  computeAsymmetricValue,
  generateSharecards,
} from "../logic";
import { AsymmetricValueInput, LanguageCategory } from "../types";

// ============================================
// TEST HELPERS
// ============================================

function createMockInput(overrides: Partial<AsymmetricValueInput> = {}): AsymmetricValueInput {
  return {
    content_type: "article",
    original_url: "https://example.com/article",
    post_text: "This is a test article about something important.",
    extracted_claims: [],
    citations_found: [],
    has_date_context: true,
    detected_date: new Date().toISOString(),
    language_features: {
      heat_score: 50,
      evidence_score: 50,
      agency_score: 30,
      ambiguity_score: 20,
      categories: [],
    },
    ...overrides,
  };
}

// ============================================
// TEST CASE 1: HIGH HEAT / LOW EVIDENCE
// ============================================

describe("High heat / low evidence", () => {
  const input = createMockInput({
    language_features: {
      heat_score: 85,
      evidence_score: 25,
      agency_score: 60,
      ambiguity_score: 40,
      categories: ["fear_alert", "call_to_share"],
    },
  });

  test("Heat vs Evidence shows warning", () => {
    const result = computeHeatVsEvidence(85, 25);
    expect(result.warning_active).toBe(true);
    expect(result.warning_label).toBe("Heat > Evidence");
    expect(result.delta).toBe(60);
  });

  test("Forecast predicts impulsive sharing", () => {
    const result = computeForecast(["fear_alert", "call_to_share"], 85, 25);
    expect(result.type).toBe("impulsive_sharing");
    expect(result.confidence).toBe("high");
  });

  test("Low-regret action suggests waiting", () => {
    const heatVsEvidence = computeHeatVsEvidence(85, 25);
    const verificationChecks = computeVerificationChecks(input);
    const result = computeLowRegretAction(input, heatVsEvidence, verificationChecks);
    expect(result.action).toContain("Wait");
  });
});

// ============================================
// TEST CASE 2: LOW HEAT / HIGH EVIDENCE
// ============================================

describe("Low heat / high evidence", () => {
  const input = createMockInput({
    language_features: {
      heat_score: 20,
      evidence_score: 80,
      agency_score: 10,
      ambiguity_score: 10,
      categories: [],
    },
    citations_found: [{ url: "https://primary.gov/doc", domain: "primary.gov", type: "primary" }],
  });

  test("Heat vs Evidence shows no warning", () => {
    const result = computeHeatVsEvidence(20, 80);
    expect(result.warning_active).toBe(false);
    expect(result.warning_label).toBeUndefined();
    expect(result.delta).toBe(-60);
  });

  test("Forecast is neutral", () => {
    const result = computeForecast([], 20, 80);
    expect(result.type).toBe("neutral");
  });

  test("Incentive fingerprint shows informational", () => {
    const result = computeIncentiveFingerprint([], 20);
    expect(result.action).toBe("inform without manipulation");
  });
});

// ============================================
// TEST CASE 3: MISSING DATE CONTEXT
// ============================================

describe("Missing date context", () => {
  const input = createMockInput({
    has_date_context: false,
    detected_date: undefined,
    citations_found: [{ url: "https://source.com", domain: "source.com", type: "primary" }],
  });

  test("Verification check shows no date", () => {
    const result = computeVerificationChecks(input);
    const dateCheck = result[1];
    expect(dateCheck.status).toBe("no");
    expect(dateCheck.label).toBe("Date context present?");
  });

  test("Low-regret action suggests checking date", () => {
    const heatVsEvidence = computeHeatVsEvidence(50, 50);
    const verificationChecks = computeVerificationChecks(input);
    const result = computeLowRegretAction(input, heatVsEvidence, verificationChecks);
    expect(result.action.toLowerCase()).toContain("date");
  });
});

// ============================================
// TEST CASE 4: MISSING CITATIONS
// ============================================

describe("Missing citations", () => {
  const input = createMockInput({
    citations_found: [],
    content_type: "tweet",
  });

  test("Verification check shows no primary source", () => {
    const result = computeVerificationChecks(input);
    const primaryCheck = result[0];
    expect(primaryCheck.status).toBe("no");
    expect(primaryCheck.detail).toContain("No sources");
  });

  test("Low-regret action suggests asking for source", () => {
    const heatVsEvidence = computeHeatVsEvidence(50, 50);
    const verificationChecks = computeVerificationChecks(input);
    const result = computeLowRegretAction(input, heatVsEvidence, verificationChecks);
    expect(result.action.toLowerCase()).toContain("source");
  });
});

// ============================================
// TEST CASE 5: SCREENSHOT CONTENT TYPE
// ============================================

describe("Screenshot content type", () => {
  const input = createMockInput({
    content_type: "screenshot",
    citations_found: [],
  });

  test("Verification check mentions screenshot risk", () => {
    const result = computeVerificationChecks(input);
    const primaryCheck = result[0];
    expect(primaryCheck.detail.toLowerCase()).toContain("screenshot");
  });

  test("Low-regret action suggests reverse image search", () => {
    const heatVsEvidence = computeHeatVsEvidence(50, 50);
    const verificationChecks = computeVerificationChecks(input);
    const result = computeLowRegretAction(input, heatVsEvidence, verificationChecks);
    expect(result.action.toLowerCase()).toContain("reverse");
  });

  test("Sharecard includes screenshot flag", () => {
    const output = computeAsymmetricValue(input);
    const sharecards = generateSharecards(
      output.forecast,
      output.heat_vs_evidence,
      output.verification_checks,
      output.low_regret_action,
      input.original_url,
      input.content_type
    );
    expect(sharecards.respectful_share.verification_flag).toBe("Screenshot risk");
  });
});

// ============================================
// TEST CASE 6: TEMPLATE MATCH PRESENT/ABSENT
// ============================================

describe("Template match", () => {
  test("Returns template when confidence >= 0.65", () => {
    const result = computeNarrativeTemplate({
      template_name: "outrage_bait",
      confidence: 0.72,
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("outrage bait");
    expect(result?.confidence).toBe(0.72);
  });

  test("Returns undefined when confidence < 0.65", () => {
    const result = computeNarrativeTemplate({
      template_name: "outrage_bait",
      confidence: 0.5,
    });
    expect(result).toBeUndefined();
  });

  test("Returns undefined when no template provided", () => {
    const result = computeNarrativeTemplate(undefined);
    expect(result).toBeUndefined();
  });
});

// ============================================
// TEST CASE 7: HIGH AMBIGUITY
// ============================================

describe("High ambiguity", () => {
  const input = createMockInput({
    language_features: {
      heat_score: 40,
      evidence_score: 30,
      agency_score: 20,
      ambiguity_score: 75,
      categories: [],
    },
    citations_found: [{ url: "https://source.com", domain: "source.com", type: "secondary" }],
  });

  test("Verification check suggests counter-evidence", () => {
    const result = computeVerificationChecks(input);
    const counterCheck = result[2];
    expect(counterCheck.status).toBe("no");
    expect(counterCheck.detail.toLowerCase()).toContain("ambiguity");
  });
});

// ============================================
// TEST CASE 8: NON-ENGLISH POST TEXT
// ============================================

describe("Non-English post text (safe rendering)", () => {
  const input = createMockInput({
    post_text: "これは日本語のテストです。重要なニュースについて。", // Japanese
    language_features: {
      heat_score: 50,
      evidence_score: 50,
      agency_score: 30,
      ambiguity_score: 20,
      categories: [],
    },
  });

  test("Computes without throwing", () => {
    expect(() => computeAsymmetricValue(input)).not.toThrow();
  });

  test("Returns valid output structure", () => {
    const result = computeAsymmetricValue(input);
    expect(result.forecast).toBeDefined();
    expect(result.heat_vs_evidence).toBeDefined();
    expect(result.verification_checks).toHaveLength(3);
    expect(result.low_regret_action).toBeDefined();
  });

  test("Sharecards render safely", () => {
    const output = computeAsymmetricValue(input);
    const sharecards = generateSharecards(
      output.forecast,
      output.heat_vs_evidence,
      output.verification_checks,
      output.low_regret_action,
      input.original_url,
      input.content_type
    );
    expect(sharecards.respectful_share.hook).toBeDefined();
    expect(sharecards.group_sanity_check.hook).toBeDefined();
    expect(sharecards.direct_warning.hook).toBeDefined();
  });
});

// ============================================
// ADDITIONAL EDGE CASES
// ============================================

describe("Edge cases", () => {
  test("Empty categories array", () => {
    const result = computeForecast([], 50, 50);
    expect(result.type).toBe("neutral");
  });

  test("All categories present", () => {
    const allCategories: LanguageCategory[] = [
      "enemy_construction",
      "betrayal_narrative",
      "fear_alert",
      "moral_purity_test",
      "humiliation",
      "status_signal",
      "conspiracy_frame",
      "doom_loop",
      "call_to_punish",
      "call_to_share",
    ];
    const result = computeForecast(allCategories, 90, 10);
    expect(result.type).not.toBe("neutral");
  });

  test("Zero scores", () => {
    const result = computeHeatVsEvidence(0, 0);
    expect(result.delta).toBe(0);
    expect(result.warning_active).toBe(false);
  });

  test("Maximum scores", () => {
    const result = computeHeatVsEvidence(100, 100);
    expect(result.delta).toBe(0);
    expect(result.warning_active).toBe(false);
  });

  test("Old date triggers partial status", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const input = createMockInput({
      has_date_context: true,
      detected_date: twoYearsAgo.toISOString(),
    });

    const result = computeVerificationChecks(input);
    const dateCheck = result[1];
    expect(dateCheck.status).toBe("partial");
    expect(dateCheck.detail.toLowerCase()).toContain("year");
  });
});

// ============================================
// INTEGRATION TEST
// ============================================

describe("Full computation flow", () => {
  test("computeAsymmetricValue returns complete output", () => {
    const input = createMockInput({
      language_features: {
        heat_score: 70,
        evidence_score: 30,
        agency_score: 50,
        ambiguity_score: 30,
        categories: ["enemy_construction", "moral_purity_test"],
      },
      template_match: {
        template_name: "tribal_signaling",
        confidence: 0.8,
      },
    });

    const result = computeAsymmetricValue(input);

    // Verify all fields present
    expect(result.forecast).toBeDefined();
    expect(result.heat_vs_evidence).toBeDefined();
    expect(result.verification_checks).toHaveLength(3);
    expect(result.incentive_fingerprint).toBeDefined();
    expect(result.narrative_template).toBeDefined(); // Should be present with 0.8 confidence
    expect(result.low_regret_action).toBeDefined();
    expect(result.computed_at).toBeDefined();
    expect(result.input_hash).toBeDefined();

    // Verify heat vs evidence warning is active
    expect(result.heat_vs_evidence.warning_active).toBe(true);

    // Verify forecast type
    expect(result.forecast.type).toBe("polarization");
  });
});
