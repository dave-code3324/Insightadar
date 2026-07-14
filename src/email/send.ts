import "dotenv/config";
import nodemailer from "nodemailer";
import { generateEmailFiles } from "./generate.js";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable manquante : ${name}`);
  return value;
};

const recipientMap = (): Record<string, string> => {
  const raw = required("CGP_RECIPIENTS_JSON");
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("CGP_RECIPIENTS_JSON doit être un objet JSON.");
  return Object.fromEntries(
    Object.entries(parsed).map(([cgp, recipient]) => {
      if (typeof recipient !== "string" || !recipient.includes("@"))
        throw new Error(`Destinataire invalide pour ${cgp}.`);
      return [cgp, recipient];
    }),
  );
};

const main = async (): Promise<void> => {
  const confirmed = process.argv.includes("--confirm");
  const digests = await generateEmailFiles();
  const recipients = recipientMap();
  if (!confirmed) {
    console.log("Simulation uniquement : aucun e-mail envoyé.");
    for (const digest of digests)
      console.log(
        `- ${digest.cgp}: ${digest.prospectIds.length} prospects, destinataire configuré=${recipients[digest.cgp] ? "oui" : "non"}`,
      );
    console.log("Ajoutez --confirm pour autoriser explicitement l’envoi.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: required("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: required("SMTP_USER"), pass: required("SMTP_PASSWORD") },
  });
  const from = required("EMAIL_FROM");
  for (const digest of digests) {
    const to = recipients[digest.cgp];
    if (!to) throw new Error(`Aucun destinataire configuré pour ${digest.cgp}.`);
    await transporter.sendMail({
      from,
      to,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
    });
    console.log(`Envoyé : ${digest.cgp} (${digest.prospectIds.length} prospects)`);
  }
};

void main().catch((error: unknown) => {
  console.error(`Erreur d’envoi : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
