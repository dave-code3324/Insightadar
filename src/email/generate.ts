import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generatePilotBatch } from "../pilot/pilotGenerator.js";
import { generateCgpDigests } from "./digestGenerator.js";

export const generateEmailFiles = async (): Promise<ReturnType<typeof generateCgpDigests>> => {
  const batchDirectory = resolve("validation/pilot/batch-001");
  const outputDirectory = resolve(batchDirectory, "emails");
  const input = await readFile(resolve(batchDirectory, "prospects-input.csv"), "utf8");
  const batch = generatePilotBatch(input);
  const digests = generateCgpDigests(batch.prospects);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all(
    digests.flatMap((digest) => [
      writeFile(resolve(outputDirectory, `${digest.cgp}.html`), digest.html, "utf8"),
      writeFile(resolve(outputDirectory, `${digest.cgp}.txt`), digest.text, "utf8"),
    ]),
  );
  await writeFile(
    resolve(outputDirectory, "manifest.json"),
    `${JSON.stringify(
      digests.map(({ cgp, subject, prospectIds }) => ({ cgp, subject, prospectIds })),
      null,
      2,
    )}\n`,
    "utf8",
  );
  return digests;
};

if (process.argv[1]?.endsWith("generate.js")) {
  void generateEmailFiles()
    .then((digests) => {
      console.log(`E-mails générés : ${digests.length}`);
      for (const digest of digests)
        console.log(`- ${digest.cgp}: ${digest.prospectIds.length} prospects`);
      console.log("Aucun e-mail n’a été envoyé.");
    })
    .catch((error: unknown) => {
      console.error(
        `Erreur de génération des e-mails : ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    });
}
