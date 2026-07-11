import { resolve } from "node:path";
import { scoreDiscussion } from "./scoring/relevanceScorer.js";
import { buildRelevanceReport } from "./scoring/relevanceReport.js";
import { JsonRepository } from "./storage/jsonRepository.js";
import type { Discussion, RelevanceReport, ScoredDiscussion } from "./types.js";

const main = async (): Promise<void> => {
  const discussions = await new JsonRepository<Discussion>(resolve("data/discussions.json")).read();
  const scored = discussions
    .map(scoreDiscussion)
    .sort((left, right) => right.relevanceScore - left.relevanceScore);
  const relevant = scored.filter((discussion) => discussion.isRelevant);
  const report = buildRelevanceReport(scored);

  await Promise.all([
    new JsonRepository<ScoredDiscussion>(resolve("data/discussions-scored.json")).save(scored),
    new JsonRepository<ScoredDiscussion>(resolve("data/discussions-relevant.json")).save(relevant),
    new JsonRepository<RelevanceReport>(resolve("data/relevance-report.json")).saveValue(report),
  ]);

  console.log(`Discussions analysées : ${report.totalDiscussions}`);
  console.log(`Discussions retenues : ${report.retainedDiscussions}`);
  console.log(`Taux de pertinence : ${report.relevanceRate}%`);
  console.log("Principales exclusions :");
  for (const item of report.mainExclusionReasons.slice(0, 5))
    console.log(`- ${item.reason}: ${item.count}`);
};

void main().catch((error: unknown) => {
  console.error(`Erreur de scoring : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
