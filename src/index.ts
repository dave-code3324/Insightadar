import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { ApifyRedditConnector } from "./connectors/apifyReddit.js";
import { financialAdvisors } from "./markets/financialAdvisors.js";
import { JsonRepository } from "./storage/jsonRepository.js";
import type { Discussion } from "./types.js";

const countBy = (
  records: readonly Discussion[],
  selector: (discussion: Discussion) => string,
): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = selector(record) || "inconnu";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Map([...counts].sort((left, right) => right[1] - left[1]));
};

const deduplicate = (records: readonly Discussion[]): Discussion[] => {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: Discussion[] = [];

  for (const record of records) {
    const duplicateId = record.id !== "" && seenIds.has(record.id);
    const duplicateUrl = record.url !== "" && seenUrls.has(record.url);
    if (duplicateId || duplicateUrl) continue;

    if (record.id !== "") seenIds.add(record.id);
    if (record.url !== "") seenUrls.add(record.url);
    unique.push(record);
  }

  return unique;
};

const printDistribution = (title: string, counts: ReadonlyMap<string, number>): void => {
  console.log(`\n${title}`);
  for (const [label, count] of counts) console.log(`- ${label}: ${count}`);
};

const main = async (): Promise<void> => {
  const config = loadConfig();
  const connector = new ApifyRedditConnector({
    token: config.apifyToken,
    actorId: config.apifyActorId,
    resultsPerQuery: config.resultsPerQuery,
  });

  const raw: Discussion[] = [];
  for (const query of financialAdvisors.queries) {
    console.log(`Recherche : ${query}`);
    const results = await connector.search(query);
    console.log(`  ${results.length} résultat(s) brut(s)`);
    raw.push(...results);
  }

  const unique = deduplicate(raw);
  const outputPath = resolve("data/discussions.json");
  await new JsonRepository<Discussion>(outputPath).save(unique);

  console.log(`\nRésultats bruts : ${raw.length}`);
  console.log(`Résultats uniques : ${unique.length}`);
  printDistribution(
    "Répartition par requête",
    countBy(unique, (item) => item.query),
  );
  printDistribution(
    "Répartition par subreddit",
    countBy(unique, (item) => item.subreddit),
  );
  console.log(`\nFichier enregistré : ${outputPath}`);
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Erreur InsightRadar : ${message}`);
  process.exitCode = 1;
});
