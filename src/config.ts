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
}

export const loadConfig = (): AppConfig => {
  const resultsPerQuery = Number(process.env.APIFY_RESULTS_PER_QUERY ?? "50");
  if (!Number.isInteger(resultsPerQuery) || resultsPerQuery < 1 || resultsPerQuery > 250) {
    throw new Error("APIFY_RESULTS_PER_QUERY doit être un entier compris entre 1 et 250.");
  }

  return {
    apifyToken: requireEnvironmentVariable("APIFY_TOKEN"),
    apifyActorId: process.env.APIFY_ACTOR_ID?.trim() || "red_crawler~reddit-search",
    resultsPerQuery,
  };
};
