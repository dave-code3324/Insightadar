import assert from "node:assert/strict";
import test from "node:test";
import type { PilotProspect } from "../pilot/pilotGenerator.js";
import { generateCgpDigests } from "./digestGenerator.js";

const prospect = (id: string, cgp: string): PilotProspect => ({
  id,
  assignedCgp: cgp,
  rowNumber: 2,
  companyName: "TEST_ONLY & ASSOCIÉS",
  pappersUrl: "https://www.pappers.fr/entreprise/test-only",
  executiveName: "Alice <Test>",
  eventType: "Création récente d'une holding",
  eventDate: "2026-07-10",
  sourceUrl: "https://example.test/event",
  notes: "Donnée de test",
  confidenceScore: 75,
  confidenceReasons: ["règle de test"],
  interpretation: "Interprétation prudente.",
  missingInformation: ["Actionnariat à confirmer."],
  falsePositiveRisks: ["Finalité administrative possible."],
  contactReason: "Événement récent.",
  contactAngle: "Questionner sans présumer.",
});

void test("groupe les prospects par CGP", () => {
  const digests = generateCgpDigests([
    prospect("P01", "CGP-1"),
    prospect("P02", "CGP-1"),
    prospect("P03", "CGP-2"),
  ]);
  assert.equal(digests.length, 2);
  assert.deepEqual(digests[0]?.prospectIds, ["P01", "P02"]);
});

void test("produit un HTML compatible email, prudent et échappé", () => {
  const digest = generateCgpDigests([prospect("P01", "CGP-1")])[0];
  assert.ok(digest);
  assert.match(digest.html, /table role="presentation"/);
  assert.match(digest.html, /TEST_ONLY &amp; ASSOCIÉS/);
  assert.doesNotMatch(digest.html, /Alice <Test>/);
  assert.match(digest.text, /ne démontre à lui seul/i);
});
