import type { RelevanceReport, ScoredDiscussion } from "../types.js";
import { RELEVANCE_THRESHOLD } from "./relevanceScorer.js";

const bucket = (score: number): string => {
  if (score < 20) return "0-19";
  if (score < 40) return "20-39";
  if (score < 60) return "40-59";
  if (score < 80) return "60-79";
  return "80-100";
};

export const buildRelevanceReport = (discussions: readonly ScoredDiscussion[]): RelevanceReport => {
  const relevant = discussions.filter((discussion) => discussion.isRelevant);
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
    for (const reason of reasons)
      exclusionReasons.set(reason, (exclusionReasons.get(reason) ?? 0) + 1);
  }

  return {
    totalDiscussions: discussions.length,
    retainedDiscussions: relevant.length,
    relevanceRate:
      discussions.length === 0
        ? 0
        : Number(((relevant.length / discussions.length) * 100).toFixed(2)),
    threshold: RELEVANCE_THRESHOLD,
    mainExclusionReasons: [...exclusionReasons]
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) => right.count - left.count),
    scoreDistribution: distribution,
    topDiscussions: [...relevant]
      .sort(
        (left, right) =>
          right.relevanceScore - left.relevanceScore || right.commentsCount - left.commentsCount,
      )
      .slice(0, 20),
  };
};
