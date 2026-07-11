import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { ApifyRedditCommentsConnector } from "./connectors/apifyRedditComments.js";
import { JsonRepository } from "./storage/jsonRepository.js";
import type { Comment, ScoredDiscussion } from "./types.js";

const deduplicate = (comments: readonly Comment[]): Comment[] => {
  const seen = new Set<string>();
  return comments.filter((comment) => {
    const key = comment.id || comment.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const main = async (): Promise<void> => {
  const config = loadConfig();
  const relevant = await new JsonRepository<ScoredDiscussion>(
    resolve("data/discussions-relevant.json"),
  ).read();
  const sample = relevant
    .sort(
      (left, right) =>
        right.relevanceScore - left.relevanceScore || right.commentsCount - left.commentsCount,
    )
    .slice(0, config.maxRelevantDiscussions);

  const connector = new ApifyRedditCommentsConnector({
    token: config.apifyToken,
    actorId: config.commentsActorId,
    maxCommentsPerDiscussion: config.maxCommentsPerDiscussion,
    minCommentScore: config.minCommentScore,
  });
  const result = await connector.collect(sample);
  const comments = deduplicate(result.comments);
  await new JsonRepository<Comment>(resolve("data/comments.json")).save(comments);

  console.log(`Discussions soumises : ${sample.length}`);
  console.log(`Éléments Apify bruts : ${result.rawItems}`);
  console.log(`Commentaires uniques : ${comments.length}`);
  console.log(`Problèmes de mapping : ${result.mappingIssues}`);
};

void main().catch((error: unknown) => {
  console.error(
    `Erreur de collecte des commentaires : ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
