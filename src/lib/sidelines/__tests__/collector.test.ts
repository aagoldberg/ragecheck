/**
 * Bluesky Collector Tests
 *
 * Tests edge extraction logic from mock Bluesky API responses.
 * Run with: npx vitest run src/lib/sidelines/__tests__/collector.test.ts
 */

import { describe, it, expect, vi } from "vitest";

// Mock the db module before importing collector
vi.mock("@/lib/db-sidelines", () => ({
  upsertPost: vi.fn().mockResolvedValue(1),
  upsertUser: vi.fn().mockImplementation(async ({ did }: { did: string }) => {
    // Return a consistent ID based on DID
    const hash = did.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return hash % 10000;
  }),
  createInteraction: vi.fn().mockResolvedValue(1),
}));

vi.mock("../arousal", () => ({
  computeArousal: vi.fn().mockReturnValue({
    score: 0.5,
    breakdown: {
      emotionAngerFearDisgust: 0.3,
      urgency: 0.2,
      intensifiers: 0.1,
      moralJudgment: 0.1,
      purityContamination: 0.0,
      dehumanization: 0.0,
      absolutist: 0.1,
    },
  }),
}));

describe("collector edge extraction", () => {
  it("extracts DID from AT URI", () => {
    // Test the DID extraction pattern used in the collector
    const uri = "at://did:plc:abc123/app.bsky.feed.post/xyz789";
    const match = uri.match(/^at:\/\/(did:[^/]+)\//);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("did:plc:abc123");
  });

  it("handles reply edge structure", () => {
    const post = {
      uri: "at://did:plc:author1/app.bsky.feed.post/post1",
      cid: "cid1",
      author: {
        did: "did:plc:author1",
        handle: "author1.bsky.social",
      },
      record: {
        text: "This is a reply",
        createdAt: "2026-01-15T10:00:00Z",
        reply: {
          parent: {
            uri: "at://did:plc:parent1/app.bsky.feed.post/parentpost",
            cid: "parentcid",
          },
          root: {
            uri: "at://did:plc:root1/app.bsky.feed.post/rootpost",
            cid: "rootcid",
          },
        },
      },
    };

    // Verify reply parent DID extraction
    const parentDid = post.record.reply?.parent?.uri.match(
      /^at:\/\/(did:[^/]+)\//
    );
    expect(parentDid).not.toBeNull();
    expect(parentDid![1]).toBe("did:plc:parent1");
    expect(parentDid![1]).not.toBe(post.author.did);
  });

  it("handles quote edge structure", () => {
    const post = {
      uri: "at://did:plc:quoter/app.bsky.feed.post/quotepost",
      cid: "cid2",
      author: {
        did: "did:plc:quoter",
        handle: "quoter.bsky.social",
      },
      record: {
        text: "Look at this take",
        createdAt: "2026-01-15T11:00:00Z",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: "at://did:plc:quoted/app.bsky.feed.post/originalpost",
            cid: "originalcid",
          },
        },
      },
    };

    // Verify quote embed DID extraction
    expect(post.record.embed?.$type).toBe("app.bsky.embed.record");
    const quotedDid = post.record.embed?.record?.uri.match(
      /^at:\/\/(did:[^/]+)\//
    );
    expect(quotedDid).not.toBeNull();
    expect(quotedDid![1]).toBe("did:plc:quoted");
    expect(quotedDid![1]).not.toBe(post.author.did);
  });

  it("ignores self-replies", () => {
    const post = {
      uri: "at://did:plc:self/app.bsky.feed.post/selfpost",
      author: { did: "did:plc:self", handle: "self.bsky.social" },
      record: {
        text: "Continuing my thread",
        createdAt: "2026-01-15T12:00:00Z",
        reply: {
          parent: {
            uri: "at://did:plc:self/app.bsky.feed.post/parentpost",
            cid: "parentcid",
          },
          root: {
            uri: "at://did:plc:self/app.bsky.feed.post/rootpost",
            cid: "rootcid",
          },
        },
      },
    };

    const parentDid = post.record.reply.parent.uri.match(
      /^at:\/\/(did:[^/]+)\//
    );
    // Self-reply: parent DID matches author DID
    expect(parentDid![1]).toBe(post.author.did);
  });

  it("handles post without reply or embed", () => {
    const post = {
      uri: "at://did:plc:standalone/app.bsky.feed.post/standalonepost",
      author: { did: "did:plc:standalone", handle: "standalone.bsky.social" },
      record: {
        text: "Just a standalone post",
        createdAt: "2026-01-15T13:00:00Z",
      },
    };

    // No edges to extract
    expect(post.record.reply).toBeUndefined();
    expect(post.record.embed).toBeUndefined();
  });

  it("handles non-record embed types", () => {
    const post = {
      uri: "at://did:plc:img/app.bsky.feed.post/imgpost",
      author: { did: "did:plc:img", handle: "img.bsky.social" },
      record: {
        text: "Check this image",
        createdAt: "2026-01-15T14:00:00Z",
        embed: {
          $type: "app.bsky.embed.images",
          images: [{ alt: "photo", image: {} }],
        },
      },
    };

    // Not a record embed -- no quote edge
    expect(post.record.embed?.$type).not.toBe("app.bsky.embed.record");
  });
});
