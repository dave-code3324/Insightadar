import assert from "node:assert/strict";
import test from "node:test";
import { generatePilotBatch } from "./pilotGenerator.js";

const TEST_INPUT = `company_name,pappers_url,executive_name,event_type,event_date,source_url,notes
TEST_ONLY_ALPHA,https://www.pappers.fr/entreprise/test-alpha,Test Alice,Cession de titres,2026-06-15,https://example.test/alpha,Opération à vérifier
TEST_ONLY_BETA,https://www.pappers.fr/entreprise/test-beta,Test Bob,Création récente d'une holding,2026-05-10,https://example.test/beta,Dirigeant actionnaire à confirmer
TEST_ONLY_GAMMA,https://www.pappers.fr/entreprise/test-gamma,Test Charlie,Simple changement administratif,2023-01-10,https://example.test/gamma,Information ambiguë et simple changement administratif
`;

void test("génère trois fiches fictives uniquement en mémoire", () => {
  const batch = generatePilotBatch(TEST_INPUT, new Date("2026-07-12T00:00:00.000Z"));
  assert.equal(batch.prospects.length, 3);
  assert.equal(batch.incompleteRows.length, 0);
  assert.match(batch.cardsMarkdown, /TEST_ONLY_ALPHA/);
  assert.match(batch.outreachMarkdown, /### LinkedIn/);
  assert.equal(batch.trackingCsv.trim().split("\n").length, 4);
});

void test("applique des règles de confiance explicables", () => {
  const batch = generatePilotBatch(TEST_INPUT, new Date("2026-07-12T00:00:00.000Z"));
  const alpha = batch.prospects[0];
  const gamma = batch.prospects[2];
  assert.ok(alpha && gamma);
  assert.ok(alpha.confidenceScore >= 75);
  assert.ok(gamma.confidenceScore < 60);
  assert.ok(gamma.confidenceReasons.some((reason) => reason.includes("administratif")));
});

void test("n’invente aucune fiche pour une ligne incomplète", () => {
  const input = `company_name,pappers_url,executive_name,event_type,event_date,source_url,notes
,,,,,,À compléter
`;
  const batch = generatePilotBatch(input, new Date("2026-07-12T00:00:00.000Z"));
  assert.equal(batch.prospects.length, 0);
  assert.equal(batch.incompleteRows.length, 1);
  assert.match(batch.cardsMarkdown, /aucune fiche prospect n’a été inventée/i);
});
