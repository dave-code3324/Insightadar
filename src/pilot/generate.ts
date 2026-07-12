import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generatePilotBatch } from "./pilotGenerator.js";

const directory = resolve("validation/pilot/batch-001");

const main = async (): Promise<void> => {
  const inputPath = resolve(directory, "prospects-input.csv");
  const input = await readFile(inputPath, "utf8");
  const batch = generatePilotBatch(input);

  await Promise.all([
    writeFile(resolve(directory, "prospect-cards.md"), batch.cardsMarkdown, "utf8"),
    writeFile(resolve(directory, "outreach-messages.md"), batch.outreachMarkdown, "utf8"),
    writeFile(resolve(directory, "batch-summary.md"), batch.summaryMarkdown, "utf8"),
    writeFile(resolve(directory, "tracking.csv"), batch.trackingCsv, "utf8"),
  ]);

  console.log(`Prospects générés : ${batch.prospects.length}/15`);
  console.log(`Lignes à compléter ou corriger : ${batch.incompleteRows.length}`);
  for (const row of batch.incompleteRows)
    console.log(`- ligne ${row.rowNumber}: ${row.missing.join(", ")}`);
};

void main().catch((error: unknown) => {
  console.error(
    `Erreur de génération du lot pilote : ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
