import assert from "node:assert/strict";
import test from "node:test";
import { scoreDiscussion } from "./relevanceScorer.js";
import type { Discussion } from "../types.js";

const discussion = (overrides: Partial<Discussion>): Discussion => ({
  id: "abc",
  source: "reddit",
  title: "",
  content: "",
  url: "https://reddit.com/r/example/comments/abc/example",
  query: "financial advisor CRM",
  subreddit: "example",
  author: "user",
  score: 1,
  commentsCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

void test("retient une douleur CRM exprimée par un CFP", () => {
  const result = scoreDiscussion(
    discussion({
      subreddit: "CFP",
      title: "Financial advisors: which CRM fixes your manual workflow?",
      content: "Our current software is frustrating and too expensive.",
      commentsCount: 12,
    }),
  );
  assert.equal(result.isRelevant, true);
  assert.equal(result.relevanceScore, 100);
});

void test("exclut un contenu de recrutement malgré la présence de RIA", () => {
  const result = scoreDiscussion(
    discussion({
      subreddit: "FinancialCareers",
      title: "RIA job interview and salary advice",
      content: "How should a recent graduate prepare a resume?",
    }),
  );
  assert.equal(result.isRelevant, false);
  assert.ok(result.relevanceReasons.some((reason) => reason.includes("carrière")));
});

void test("exclut un conseil d’investissement personnel", () => {
  const result = scoreDiscussion(
    discussion({
      subreddit: "stocks",
      title: "Wealth management stocks and my portfolio",
      content: "Should I rebalance my ETF and retirement account?",
    }),
  );
  assert.equal(result.isRelevant, false);
  assert.ok(result.relevanceReasons.some((reason) => reason.includes("finances personnelles")));
});
