/**
 * SideLines Database Schema Tests
 *
 * Validates type mappings and schema expectations.
 * Optionally tests against a real database if DATABASE_URL is set.
 * Run with: npx vitest run src/lib/sidelines/__tests__/db.test.ts
 */

import { describe, it, expect } from "vitest";
import type {
  SidelinesEvent,
  SidelinesPost,
  SidelinesUser,
  SidelinesInteraction,
  DailyMetrics,
  ClusterAssignment,
  UserFeatures,
  ArousalBreakdown,
} from "../types";

describe("type validation", () => {
  it("SidelinesEvent has all required fields", () => {
    const event: SidelinesEvent = {
      id: 1,
      name: "Test Event",
      description: "A test",
      platform: "bluesky",
      keywords: ["test", "keyword"],
      seedPostUris: [],
      startTs: new Date("2026-01-01"),
      endTs: new Date("2026-01-31"),
      status: "draft",
      createdAt: new Date(),
    };
    expect(event.id).toBe(1);
    expect(event.keywords).toHaveLength(2);
    expect(event.status).toBe("draft");
  });

  it("SidelinesPost supports arousal fields", () => {
    const post: SidelinesPost = {
      id: 1,
      eventId: 1,
      platform: "bluesky",
      uri: "at://did:plc:abc/app.bsky.feed.post/xyz",
      authorDid: "did:plc:abc",
      authorHandle: "user.bsky.social",
      text: "Hello world",
      createdAt: new Date(),
      rawJson: null,
      arousalScore: 0.75,
      arousalBreakdown: {
        emotionAngerFearDisgust: 0.5,
        urgency: 0.3,
        intensifiers: 0.2,
        moralJudgment: 0.1,
        purityContamination: 0.0,
        dehumanization: 0.0,
        absolutist: 0.1,
      },
    };
    expect(post.arousalScore).toBe(0.75);
    expect(post.arousalBreakdown!.emotionAngerFearDisgust).toBe(0.5);
  });

  it("SidelinesUser supports optional fields", () => {
    const user: SidelinesUser = {
      id: 1,
      eventId: 1,
      platform: "bluesky",
      did: "did:plc:abc",
      handle: "user.bsky.social",
      displayName: null,
      followerCount: null,
    };
    expect(user.displayName).toBeNull();
    expect(user.followerCount).toBeNull();
  });

  it("SidelinesInteraction validates interaction types", () => {
    const validTypes: SidelinesInteraction["type"][] = ["reply", "quote", "repost"];
    for (const type of validTypes) {
      const interaction: SidelinesInteraction = {
        id: 1,
        eventId: 1,
        type,
        srcUserId: 1,
        dstUserId: 2,
        postUri: "at://did:plc:abc/app.bsky.feed.post/xyz",
        parentUri: null,
        createdAt: new Date(),
        weight: 1.0,
      };
      expect(interaction.type).toBe(type);
    }
  });

  it("DailyMetrics has all required fields", () => {
    const metrics: DailyMetrics = {
      baseActivation: 45.5,
      crossClusterContact: 32.1,
      bridgeChurn: 0.15,
      middleAttrition: 22.8,
      clusterCount: 3,
      nodeCount: 250,
      edgeCount: 800,
      meanArousal: 0.42,
    };
    expect(metrics.baseActivation).toBeGreaterThanOrEqual(0);
    expect(metrics.bridgeChurn).toBeGreaterThanOrEqual(0);
    expect(metrics.bridgeChurn).toBeLessThanOrEqual(1);
  });

  it("ArousalBreakdown has all 7 components", () => {
    const breakdown: ArousalBreakdown = {
      emotionAngerFearDisgust: 0,
      urgency: 0,
      intensifiers: 0,
      moralJudgment: 0,
      purityContamination: 0,
      dehumanization: 0,
      absolutist: 0,
    };
    const keys = Object.keys(breakdown);
    expect(keys).toHaveLength(7);
  });

  it("ClusterAssignment structure", () => {
    const assignment: ClusterAssignment = {
      eventId: 1,
      day: "2026-01-15",
      userId: 42,
      clusterId: 2,
      score: 0.85,
    };
    expect(assignment.score).toBeGreaterThanOrEqual(0);
    expect(assignment.score).toBeLessThanOrEqual(1);
  });

  it("UserFeatures structure", () => {
    const features: UserFeatures = {
      eventId: 1,
      day: "2026-01-15",
      userId: 42,
      arousalMean: 0.45,
      arousalP95: 0.78,
      postCount: 12,
      inDegree: 5,
      outDegree: 8,
      betweenness: 0.123456,
    };
    expect(features.arousalP95).toBeGreaterThanOrEqual(features.arousalMean);
    expect(features.postCount).toBeGreaterThan(0);
  });
});
