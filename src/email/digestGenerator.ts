import type { PilotProspect } from "../pilot/pilotGenerator.js";

export interface CgpDigest {
  cgp: string;
  subject: string;
  html: string;
  text: string;
  prospectIds: string[];
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));

const emailSubject = (prospect: PilotProspect): string =>
  `Échange à la suite de ${prospect.eventType.toLowerCase()}`;

const emailMessage = (prospect: PilotProspect): string =>
  `Bonjour ${prospect.executiveName},\n\nJ’ai pris connaissance de l’information publique concernant ${prospect.eventType.toLowerCase()} chez ${prospect.companyName}, annoncée le ${formatDate(prospect.eventDate)}.\n\nCe type d’événement peut soulever, selon la situation de chacun, des questions de structuration ou de préparation de la suite. Je vous propose un échange de 15 minutes pour déterminer si l’un de ces sujets est pertinent pour vous. Si ce n’est pas le cas, aucun souci.\n\nBien cordialement,\n\n[Signature du CGP]`;

const linkedInMessage = (prospect: PilotProspect): string =>
  `Bonjour ${prospect.executiveName}, j’ai vu l’annonce publique concernant ${prospect.eventType.toLowerCase()} chez ${prospect.companyName}. Je serais heureux d’échanger brièvement sur les sujets de préparation qui peuvent parfois accompagner ce type d’événement, uniquement si cela vous est pertinent.`;

const cardHtml = (prospect: PilotProspect, index: number): string => `
<tr><td style="padding:0 24px 24px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dfe6ee;border-radius:12px;background:#ffffff;border-collapse:separate">
    <tr><td style="padding:20px 22px 14px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td style="font:700 12px Arial,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Prospect ${index + 1} · ${escapeHtml(prospect.id)}</td>
        <td align="right"><span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#e8f5ee;color:#176b43;font:700 12px Arial,sans-serif">Confiance ${prospect.confidenceScore}/100</span></td>
      </tr></table>
      <h2 style="margin:12px 0 3px;font:700 21px Arial,sans-serif;color:#14213d">${escapeHtml(prospect.companyName)}</h2>
      <p style="margin:0;font:15px Arial,sans-serif;color:#475569">${escapeHtml(prospect.executiveName)}</p>
    </td></tr>
    <tr><td style="padding:0 22px 18px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;border-radius:8px">
        <tr><td style="padding:13px 15px;font:13px Arial,sans-serif;color:#64748b;width:120px">Événement</td><td style="padding:13px 15px;font:700 14px Arial,sans-serif;color:#14213d">${escapeHtml(prospect.eventType)}</td></tr>
        <tr><td style="padding:0 15px 13px;font:13px Arial,sans-serif;color:#64748b">Date</td><td style="padding:0 15px 13px;font:14px Arial,sans-serif;color:#14213d">${escapeHtml(formatDate(prospect.eventDate))}</td></tr>
      </table>
      <h3 style="margin:18px 0 6px;font:700 14px Arial,sans-serif;color:#14213d">Pourquoi maintenant</h3>
      <p style="margin:0;font:14px/1.55 Arial,sans-serif;color:#334155">${escapeHtml(prospect.contactReason)}</p>
      <h3 style="margin:16px 0 6px;font:700 14px Arial,sans-serif;color:#14213d">Angle recommandé</h3>
      <p style="margin:0;font:14px/1.55 Arial,sans-serif;color:#334155">${escapeHtml(prospect.contactAngle)}</p>
      <p style="margin:15px 0 0;font:13px Arial,sans-serif"><a href="${escapeHtml(prospect.pappersUrl)}" style="color:#1261a0;text-decoration:none;font-weight:700">Voir Pappers</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escapeHtml(prospect.sourceUrl)}" style="color:#1261a0;text-decoration:none;font-weight:700">Voir la source de l’événement</a></p>
    </td></tr>
    <tr><td style="padding:18px 22px;background:#f7f9fc;border-radius:0 0 12px 12px;border-top:1px solid #e8edf3">
      <h3 style="margin:0 0 8px;font:700 14px Arial,sans-serif;color:#14213d">Email proposé</h3>
      <p style="margin:0 0 9px;font:700 13px Arial,sans-serif;color:#475569">Objet : ${escapeHtml(emailSubject(prospect))}</p>
      <div style="white-space:pre-line;font:14px/1.55 Arial,sans-serif;color:#334155;background:#fff;padding:14px;border:1px solid #e2e8f0;border-radius:7px">${escapeHtml(emailMessage(prospect))}</div>
      <h3 style="margin:16px 0 8px;font:700 14px Arial,sans-serif;color:#14213d">Message LinkedIn</h3>
      <div style="font:14px/1.55 Arial,sans-serif;color:#334155;background:#fff;padding:14px;border:1px solid #e2e8f0;border-radius:7px">${escapeHtml(linkedInMessage(prospect))}</div>
    </td></tr>
  </table>
</td></tr>`;

const digestHtml = (prospects: readonly PilotProspect[]): string => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InsightRadar</title></head>
<body style="margin:0;background:#eef2f6;padding:0">
<div style="display:none;max-height:0;overflow:hidden">${prospects.length} opportunités documentées à examiner cette semaine.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6"><tr><td align="center" style="padding:24px 10px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#fff;border-radius:14px;overflow:hidden">
    <tr><td style="padding:30px 30px 26px;background:#14213d">
      <p style="margin:0 0 9px;font:700 12px Arial,sans-serif;color:#8ecae6;text-transform:uppercase;letter-spacing:.1em">InsightRadar · Batch 001</p>
      <h1 style="margin:0;font:700 27px/1.2 Arial,sans-serif;color:#fff">Vos ${prospects.length} opportunités à examiner</h1>
      <p style="margin:12px 0 0;font:15px/1.5 Arial,sans-serif;color:#d9e2ec">Une sélection fondée sur des événements publics récents, avec les éléments nécessaires pour décider rapidement qui contacter.</p>
    </td></tr>
    <tr><td style="padding:22px 30px 20px">
      <p style="margin:0 0 10px;font:15px/1.55 Arial,sans-serif;color:#334155">Bonjour,</p>
      <p style="margin:0;font:15px/1.55 Arial,sans-serif;color:#334155">Voici votre sélection de la semaine. Avant tout contact, ouvrez les sources et confirmez le rôle du dirigeant ainsi que la pertinence du signal. Les messages proposés restent volontairement prudents.</p>
      <div style="margin-top:16px;padding:12px 14px;border-left:4px solid #f4a261;background:#fff8ef;font:13px/1.5 Arial,sans-serif;color:#6b4f2c"><strong>Point de vigilance :</strong> aucun événement d’entreprise ne démontre à lui seul que le dirigeant a personnellement reçu ou détient des liquidités.</div>
    </td></tr>
${prospects.map(cardHtml).join("")}
    <tr><td style="padding:0 30px 28px"><p style="margin:0;font:13px/1.5 Arial,sans-serif;color:#64748b">Merci d’indiquer dans le fichier de suivi les prospects contactés, les réponses obtenues et les faux positifs. Ces retours détermineront la suite du pilote.</p></td></tr>
  </table>
</td></tr></table>
</body></html>`;

const digestText = (prospects: readonly PilotProspect[]): string => {
  const cards = prospects.map(
    (prospect, index) =>
      `${index + 1}. ${prospect.companyName} — ${prospect.executiveName}\nÉvénement : ${prospect.eventType} (${formatDate(prospect.eventDate)})\nConfiance : ${prospect.confidenceScore}/100\nPourquoi maintenant : ${prospect.contactReason}\nAngle : ${prospect.contactAngle}\nPappers : ${prospect.pappersUrl}\nSource : ${prospect.sourceUrl}\n\nEMAIL PROPOSÉ\nObjet : ${emailSubject(prospect)}\n${emailMessage(prospect)}\n\nLINKEDIN\n${linkedInMessage(prospect)}`,
  );
  return `InsightRadar — Batch 001\n\nBonjour,\n\nVoici vos ${prospects.length} opportunités à examiner cette semaine. Vérifiez chaque source avant contact. Aucun événement d’entreprise ne démontre à lui seul que le dirigeant a personnellement reçu ou détient des liquidités.\n\n${cards.join("\n\n---\n\n")}\n\nMerci de renseigner les actions et résultats dans le fichier de suivi.`;
};

export const generateCgpDigests = (prospects: readonly PilotProspect[]): CgpDigest[] => {
  const groups = new Map<string, PilotProspect[]>();
  for (const prospect of prospects) {
    const group = groups.get(prospect.assignedCgp) ?? [];
    group.push(prospect);
    groups.set(prospect.assignedCgp, group);
  }
  return [...groups.entries()].map(([cgp, group]) => ({
    cgp,
    subject: `InsightRadar — ${group.length} opportunités à examiner | Batch 001`,
    html: digestHtml(group),
    text: digestText(group),
    prospectIds: group.map((prospect) => prospect.id),
  }));
};
