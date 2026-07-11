import "dotenv/config";

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value || value.includes("REPLACE_ME")) {
    throw new Error(
      `Variable ${name} manquante. Copiez .env.example vers .env et utilisez un token régénéré.`,
    );
  }
  return value;
};

export interface AppConfig {
  readonly apifyToken: string;
  readonly apifyActorId: string;
  readonly resultsPerQuery: number;
  readonly commentsActorId: string;
  readonly maxRelevantDiscussions: number;
  readonly maxCommentsPerDiscussion: number;
  readonly minCommentScore: number;
}

const integerVariable = (
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} doit être un entier compris entre ${minimum} et ${maximum}.`);
  }
  return value;
};

export const loadConfig = (): AppConfig => {
  const resultsPerQuery = integerVariable("APIFY_RESULTS_PER_QUERY", 50, 1, 250);

  return {
    apifyToken: requireEnvironmentVariable("APIFY_TOKEN"),
    apifyActorId: process.env.APIFY_ACTOR_ID?.trim() || "red_crawler~reddit-search",
    resultsPerQuery,
    commentsActorId:
      process.env.APIFY_COMMENTS_ACTOR_ID?.trim() || "crawlerbros~reddit-comment-scraper-pro",
    maxRelevantDiscussions: integerVariable("MAX_RELEVANT_DISCUSSIONS", 100, 1, 1000),
    maxCommentsPerDiscussion: integerVariable("MAX_COMMENTS_PER_DISCUSSION", 100, 1, 10_000),
    minCommentScore: integerVariable("MIN_COMMENT_SCORE", -10_000, -10_000, 10_000_000),
  };
};
