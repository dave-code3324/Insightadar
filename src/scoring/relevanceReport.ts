import type { RelevanceReport, ScoredDiscussion } from "../types.js";
import { RELEVANCE_THRESHOLD } from "./relevanceScorer.js";

const bucket = (score: number): string => {
  if (score < 20) return "0-19";
  if (score < 40) return "20-39";
  if (score < 60) return "40-59";
  if (score < 80) return "60-79";
  return "80-100";
};

const countBy = (
  discussions: readonly ScoredDiscussion[],
  selector: (discussion: ScoredDiscussion) => string,
): Record<string, number> => {
  const counts = new Map<string, number>();
  for (const discussion of discussions) {
    const key = selector(discussion) || "inconnu";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts].sort((left, right) => right[1] - left[1]));
};

const isSpecializedCommunity = (subreddit: string): boolean =>
  /^(cfp|financialadvisors|financialplanning|wealthmanagement|series7exam)$/i.test(subreddit);

const falsePositiveRisk = (discussion: ScoredDiscussion): number => {
  const negativeCount = discussion.relevanceReasons.filter((reason) =>
    reason.startsWith("-"),
  ).length;
  return (
    100 -
    discussion.relevanceScore +
    negativeCount * 30 +
    (isSpecializedCommunity(discussion.subreddit) ? 0 : 20)
  );
};

const buildReviewSample = (
  discussions: readonly ScoredDiscussion[],
): RelevanceReport["reviewSample"] => {
  const sorted = [...discussions].sort((left, right) => right.relevanceScore - left.relevanceScore);
  const selected = new Map<string, ScoredDiscussion>();
  const sampleSize = Math.min(30, sorted.length);
  for (let index = 0; index < sampleSize; index += 1) {
    const position = Math.round((index * (sorted.length - 1)) / Math.max(1, sampleSize - 1));
    const discussion = sorted[position];
    if (discussion) selected.set(discussion.id || discussion.url, discussion);
  }

  return [...selected.values()].map((discussion) => ({
    title: discussion.title,
    subreddit: discussion.subreddit,
    score: discussion.relevanceScore,
    decision: discussion.isRelevant ? "retained" : "excluded",
    positiveReasons: discussion.relevanceReasons.filter((reason) => reason.startsWith("+")),
    negativeReasons: discussion.relevanceReasons.filter(
      (reason) => reason.startsWith("-") || reason.startsWith("plafond"),
    ),
  }));
};

export const buildRelevanceReport = (discussions: readonly ScoredDiscussion[]): RelevanceReport => {
  const relevant = discussions.filter((discussion) => discussion.isRelevant);
  const excluded = discussions.filter((discussion) => !discussion.isRelevant);
  const exclusionReasons = new Map<string, number>();
  const distribution: Record<string, number> = {
    "0-19": 0,
    "20-39": 0,
    "40-59": 0,
    "60-79": 0,
    "80-100": 0,
  };

  for (const discussion of discussions) {
    distribution[bucket(discussion.relevanceScore)] =
      (distribution[bucket(discussion.relevanceScore)] ?? 0) + 1;
    if (discussion.isRelevant) continue;
    const negativeReasons = discussion.relevanceReasons.filter((reason) => reason.startsWith("-"));
    const reasons = negativeReasons.length > 0 ? negativeReasons : ["score insuffisant"];
    for (const reason of reasons) {
      exclusionReasons.set(reason, (exclusionReasons.get(reason) ?? 0) + 1);
    }
  }

  const orderedExclusions = [...exclusionReasons]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count);

  return {
    totalDiscussions: discussions.length,
    retainedDiscussions: relevant.length,
    relevanceRate:
      discussions.length === 0
        ? 0
        : Number(((relevant.length / discussions.length) * 100).toFixed(2)),
    threshold: RELEVANCE_THRESHOLD,
    mainExclusionReasons: orderedExclusions,
    scoreDistribution: distribution,
    topDiscussions: [...relevant]
      .sort(
        (left, right) =>
          right.relevanceScore - left.relevanceScore || right.commentsCount - left.commentsCount,
      )
      .slice(0, 20),
    likelyFalsePositives: [...relevant]
      .sort((left, right) => falsePositiveRisk(right) - falsePositiveRisk(left))
      .slice(0, 20),
    likelyFalseNegatives: excluded
      .filter((discussion) => discussion.relevanceReasons.some((reason) => reason.startsWith("+")))
      .sort(
        (left, right) =>
          right.relevanceScore - left.relevanceScore || right.commentsCount - left.commentsCount,
      )
      .slice(0, 20),
    exclusionRuleContributions: orderedExclusions
      .filter(({ reason }) => reason.startsWith("-"))
      .map(({ reason: rule, count }) => ({ rule, count })),
    relevantBySubreddit: countBy(relevant, (discussion) => discussion.subreddit),
    relevantByQuery: countBy(relevant, (discussion) => discussion.query),
    reviewSample: buildReviewSample(discussions),
  };
};
