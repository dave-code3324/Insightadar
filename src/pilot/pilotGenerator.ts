import { csvRow, parseCsv } from "./csv.js";

const INPUT_HEADERS = [
  "company_name",
  "pappers_url",
  "executive_name",
  "event_type",
  "event_date",
  "source_url",
  "notes",
] as const;

const TRACKING_HEADERS = [
  "batch_id",
  "CGP",
  "prospect",
  "entreprise",
  "événement",
  "date_envoi",
  "score",
  "prospect_contacté",
  "canal",
  "date_contact",
  "réponse_obtenue",
  "rendez_vous_obtenu",
  "raison_non_contact",
  "qualité_perçue_1_à_5",
  "commentaire_CGP",
  "continuerait_à_utiliser",
  "prix_accepté",
  "résultat_final",
  "card_sent",
  "contacted_within_48h",
  "feedback_received",
  "false_positive",
  "false_positive_reason",
] as const;

interface InputRow {
  rowNumber: number;
  companyName: string;
  pappersUrl: string;
  executiveName: string;
  eventType: string;
  eventDate: string;
  sourceUrl: string;
  notes: string;
}

interface EventRule {
  points: number;
  interpretation: string;
  risk: string;
  contactReason: string;
  angle: string;
}

export interface PilotProspect extends InputRow {
  id: string;
  assignedCgp: string;
  confidenceScore: number;
  confidenceReasons: string[];
  interpretation: string;
  missingInformation: string[];
  falsePositiveRisks: string[];
  contactReason: string;
  contactAngle: string;
}

export interface PilotBatch {
  prospects: PilotProspect[];
  incompleteRows: Array<{ rowNumber: number; missing: string[] }>;
  cardsMarkdown: string;
  outreachMarkdown: string;
  summaryMarkdown: string;
  trackingCsv: string;
}

const normalized = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const eventRule = (eventType: string): EventRule => {
  const event = normalized(eventType);
  if (/cession|apport de titres?/.test(event)) {
    return {
      points: 35,
      interpretation:
        "L’opération peut justifier une conversation sur la structuration, le réemploi ou la transmission, sous réserve de confirmer la situation personnelle du dirigeant.",
      risk: "L’opération peut concerner la société ou d’autres actionnaires sans bénéfice personnel pour le dirigeant.",
      contactReason:
        "L’opération est récente et peut ouvrir une fenêtre de réflexion patrimoniale.",
      angle:
        "Proposer un échange général sur les décisions patrimoniales qui suivent ce type d’opération, sans présumer de son produit personnel.",
    };
  }
  if (/creation.*holding|holding.*creation/.test(event)) {
    return {
      points: 30,
      interpretation:
        "La création d’une holding peut accompagner une réorganisation professionnelle ou patrimoniale à clarifier avec le dirigeant.",
      risk: "La holding peut avoir une finalité uniquement opérationnelle ou administrative.",
      contactReason:
        "La création récente rend pertinent un échange sur les objectifs de structuration.",
      angle:
        "Questionner les objectifs de la nouvelle structure et les sujets de long terme, sans présenter d’optimisation comme acquise.",
    };
  }
  if (/actionnariat/.test(event)) {
    return {
      points: 27,
      interpretation:
        "Un changement significatif d’actionnariat peut modifier les enjeux de gouvernance, de protection ou de transmission.",
      risk: "Le dirigeant peut ne pas être actionnaire ou ne pas être concerné économiquement par le changement.",
      contactReason:
        "Le changement récent peut créer de nouvelles décisions de structuration ou de protection.",
      angle:
        "Aborder les conséquences générales d’un changement d’actionnariat et demander si un diagnostic serait utile.",
    };
  }
  if (/fusion|transmission/.test(event)) {
    return {
      points: 30,
      interpretation:
        "Une fusion ou transmission peut faire émerger des sujets de gouvernance, protection, allocation ou préparation de la suite.",
      risk: "L’événement juridique peut être interne au groupe et sans conséquence patrimoniale personnelle.",
      contactReason:
        "La proximité temporelle de l’opération permet un échange factuel sur l’après-opération.",
      angle:
        "Proposer un point de recul sur les décisions personnelles et professionnelles à anticiper après l’opération.",
    };
  }
  if (/distribution.*exceptionnelle|dividende.*exceptionnel/.test(event)) {
    return {
      points: 27,
      interpretation:
        "Une distribution exceptionnelle au niveau de l’entreprise peut justifier de vérifier si le dirigeant est concerné et s’il existe un besoin de conseil.",
      risk: "Une distribution de société ne prouve ni l’identité des bénéficiaires ni la réception personnelle de liquidités.",
      contactReason:
        "L’annonce récente permet de proposer une conversation sans affirmer que le dirigeant en bénéficie.",
      angle:
        "Évoquer les questions générales de structuration après une distribution, puis vérifier prudemment la pertinence personnelle.",
    };
  }
  if (/vente.*filiale/.test(event)) {
    return {
      points: 30,
      interpretation:
        "La vente d’une filiale peut modifier la stratégie de l’entreprise et potentiellement les priorités de ses actionnaires.",
      risk: "Le produit de vente appartient généralement à la société vendeuse et non automatiquement au dirigeant.",
      contactReason:
        "L’opération récente peut être un moment adapté pour discuter des priorités futures.",
      angle:
        "S’intéresser aux projets post-opération sans faire d’hypothèse sur la destination du produit de cession.",
    };
  }
  if (/depart.*dirigeant.*actionnaire|dirigeant.*actionnaire.*depart/.test(event)) {
    return {
      points: 25,
      interpretation:
        "Le départ d’un dirigeant actionnaire peut entraîner des décisions de gouvernance, de cession ou de transition patrimoniale.",
      risk: "Le départ opérationnel ne signifie pas nécessairement une cession de titres.",
      contactReason:
        "La transition récente peut rendre utile un échange sur les prochaines étapes.",
      angle:
        "Proposer un échange sur la préparation de la transition, sans supposer une vente de titres.",
    };
  }
  return {
    points: 5,
    interpretation:
      "Le lien patrimonial de cet événement doit être établi avant toute prise de contact.",
    risk: "Type d’événement non reconnu ou lien patrimonial ambigu.",
    contactReason:
      "Contacter uniquement après vérification manuelle d’un besoin potentiel crédible.",
    angle:
      "Demander si l’événement public soulève un sujet de conseil, sans suggérer de conséquence personnelle.",
  };
};

const validUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const parseInput = (csv: string): InputRow[] => {
  const rows = parseCsv(csv);
  const headers = rows.shift();
  if (!headers || INPUT_HEADERS.some((header, index) => headers[index] !== header)) {
    throw new Error(`En-têtes CSV attendus : ${INPUT_HEADERS.join(",")}`);
  }
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    companyName: row[0]?.trim() ?? "",
    pappersUrl: row[1]?.trim() ?? "",
    executiveName: row[2]?.trim() ?? "",
    eventType: row[3]?.trim() ?? "",
    eventDate: row[4]?.trim() ?? "",
    sourceUrl: row[5]?.trim() ?? "",
    notes: row[6]?.trim() ?? "",
  }));
};

const missingFields = (row: InputRow): string[] => {
  const missing: string[] = [];
  if (!row.companyName) missing.push("company_name");
  if (!row.pappersUrl) missing.push("pappers_url");
  else if (!validUrl(row.pappersUrl) || !new URL(row.pappersUrl).hostname.endsWith("pappers.fr"))
    missing.push("pappers_url valide");
  if (!row.executiveName) missing.push("executive_name");
  if (!row.eventType) missing.push("event_type");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.eventDate) || Number.isNaN(Date.parse(row.eventDate)))
    missing.push("event_date AAAA-MM-JJ");
  if (!row.sourceUrl) missing.push("source_url");
  else if (!validUrl(row.sourceUrl)) missing.push("source_url HTTPS valide");
  return missing;
};

const scoreProspect = (
  row: InputRow,
  generatedAt: Date,
): Omit<
  PilotProspect,
  | keyof InputRow
  | "id"
  | "assignedCgp"
  | "interpretation"
  | "missingInformation"
  | "falsePositiveRisks"
  | "contactReason"
  | "contactAngle"
> => {
  const reasons = ["+10 source Pappers", "+10 source complémentaire", "+10 dirigeant identifié"];
  const rule = eventRule(row.eventType);
  let score = 30 + rule.points;
  reasons.push(`+${rule.points} type d’événement`);
  const ageDays = Math.floor(
    (generatedAt.getTime() - new Date(row.eventDate).getTime()) / 86_400_000,
  );
  if (ageDays >= 0 && ageDays <= 90) {
    score += 15;
    reasons.push("+15 événement de moins de 90 jours");
  } else if (ageDays <= 365) {
    score += 8;
    reasons.push("+8 événement de moins d’un an");
  } else if (ageDays > 730) {
    score -= 25;
    reasons.push("-25 événement de plus de deux ans");
  } else {
    score -= 5;
    reasons.push("-5 événement de plus d’un an");
  }

  const notes = normalized(row.notes);
  const penalties: Array<[RegExp, number, string]> = [
    [/non actionnaire/, -30, "dirigeant indiqué comme non actionnaire"],
    [/procedure collective/, -40, "procédure collective"],
    [/ambigu/, -20, "information ambiguë"],
    [/administratif/, -25, "simple changement administratif"],
    [/sans lien patrimonial/, -25, "lien patrimonial non établi"],
  ];
  for (const [pattern, points, reason] of penalties) {
    if (!pattern.test(notes)) continue;
    score += points;
    reasons.push(`${points} ${reason}`);
  }
  return { confidenceScore: Math.max(0, Math.min(100, score)), confidenceReasons: reasons };
};

const markdownLink = (label: string, url: string): string => `[${label}](${url})`;

const cardsMarkdown = (prospects: readonly PilotProspect[], incompleteCount: number): string => {
  const intro = `# Fiches prospects — Batch 001\n\n${prospects.length} fiche(s) générée(s). ${incompleteCount} ligne(s) restent à compléter dans \`prospects-input.csv\`.\n`;
  if (prospects.length === 0)
    return `${intro}\nAucune donnée réelle complète : aucune fiche prospect n’a été inventée.\n`;
  return `${intro}${prospects
    .map(
      (prospect) =>
        `\n## ${prospect.id} — ${prospect.companyName}\n\n- **CGP attribué :** ${prospect.assignedCgp}\n- **Entreprise :** ${prospect.companyName}\n- **Dirigeant :** ${prospect.executiveName}\n- **Événement identifié :** ${prospect.eventType}\n- **Date :** ${prospect.eventDate}\n- **Sources :** ${markdownLink("Pappers", prospect.pappersUrl)} · ${markdownLink("Source de l’événement", prospect.sourceUrl)}\n- **Score de confiance :** ${prospect.confidenceScore}/100\n- **Calcul :** ${prospect.confidenceReasons.join(" ; ")}\n\n### Éléments factuels observés\n\n- Événement déclaré dans le fichier : ${prospect.eventType}, daté du ${prospect.eventDate}.\n- Notes à vérifier : ${prospect.notes || "Aucune note complémentaire fournie."}\n\n### Interprétation patrimoniale possible\n\n${prospect.interpretation}\n\n> Aucun élément de cette fiche ne démontre que le dirigeant a personnellement reçu ou détient des liquidités.\n\n### Informations manquantes\n\n${prospect.missingInformation.map((item) => `- ${item}`).join("\n")}\n\n### Risques de faux positif\n\n${prospect.falsePositiveRisks.map((item) => `- ${item}`).join("\n")}\n\n### Pourquoi contacter maintenant\n\n${prospect.contactReason}\n\n### Angle recommandé\n\n${prospect.contactAngle}\n`,
    )
    .join("\n---\n")}`;
};

const outreachMarkdown = (prospects: readonly PilotProspect[]): string => {
  if (prospects.length === 0)
    return "# Messages de prospection — Batch 001\n\nAucun message généré : complétez d’abord les lignes réelles de `prospects-input.csv`.\n";
  return `# Messages de prospection — Batch 001\n${prospects
    .map(
      (prospect) =>
        `\n## ${prospect.id} — ${prospect.companyName}\n\n### Email\n\n**Objet :** Échange à la suite de ${prospect.eventType.toLowerCase()}\n\nBonjour ${prospect.executiveName},\n\nJ’ai pris connaissance de l’information publique concernant ${prospect.eventType.toLowerCase()} chez ${prospect.companyName}, annoncée le ${prospect.eventDate}.\n\nCe type d’événement peut soulever, selon la situation de chacun, des questions de structuration ou de préparation de la suite. Je vous propose un échange de 15 minutes pour déterminer si l’un de ces sujets est pertinent pour vous. Si ce n’est pas le cas, aucun souci.\n\nBien cordialement,\n\n[Signature du CGP]\n\n### LinkedIn\n\nBonjour ${prospect.executiveName}, j’ai vu l’annonce publique concernant ${prospect.eventType.toLowerCase()} chez ${prospect.companyName}. Je serais heureux d’échanger brièvement sur les sujets de préparation qui peuvent parfois accompagner ce type d’événement, uniquement si cela vous est pertinent.\n\n### Pourquoi cet angle\n\n${prospect.contactAngle} Le message cite uniquement l’événement public et n’infère aucune situation patrimoniale personnelle.\n`,
    )
    .join("\n---\n")}`;
};

const trackingCsv = (prospects: readonly PilotProspect[]): string => {
  const rows = prospects.map((prospect) =>
    csvRow([
      "batch-001",
      prospect.assignedCgp,
      prospect.executiveName,
      prospect.companyName,
      prospect.eventType,
      "",
      prospect.confidenceScore,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  return `${csvRow(TRACKING_HEADERS)}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
};

const summaryMarkdown = (
  prospects: readonly PilotProspect[],
  incompleteRows: PilotBatch["incompleteRows"],
): string => {
  const byEvent = new Map<string, number>();
  for (const prospect of prospects)
    byEvent.set(prospect.eventType, (byEvent.get(prospect.eventType) ?? 0) + 1);
  const average =
    prospects.length === 0
      ? 0
      : Number(
          (
            prospects.reduce((sum, prospect) => sum + prospect.confidenceScore, 0) /
            prospects.length
          ).toFixed(1),
        );
  const completionRecommendation =
    incompleteRows.length > 0
      ? "Compléter ou corriger les lignes signalées avant toute utilisation."
      : "Le lot contient 15 lignes complètes ; ne conserver que celles qui passent la relecture manuelle finale.";
  return `# Résumé — Batch 001\n\n- **Prospects générés :** ${prospects.length}/15\n- **Lignes à compléter ou corriger :** ${incompleteRows.length}\n- **Score moyen :** ${average}/100\n- **Confiance élevée (≥ 75) :** ${prospects.filter((prospect) => prospect.confidenceScore >= 75).length}\n\n## Répartition par événement\n\n${byEvent.size > 0 ? [...byEvent].map(([event, count]) => `- ${event}: ${count}`).join("\n") : "Aucun événement réel complet."}\n\n## Lignes à compléter\n\n${incompleteRows.length > 0 ? incompleteRows.map((row) => `- Ligne ${row.rowNumber}: ${row.missing.join(", ")}`).join("\n") : "Aucune."}\n\n## Principales limites\n\n- Le score mesure la qualité documentaire et la plausibilité du signal, pas le patrimoine personnel.\n- Les notes et sources doivent être relues manuellement avant envoi.\n- Une opération d’entreprise ne prouve jamais à elle seule la réception personnelle de liquidités.\n- Les coordonnées et le droit de prospection doivent être vérifiés par le CGP.\n\n## Recommandations avant envoi\n\n1. ${completionRecommendation}\n2. Ouvrir chaque source et vérifier identité, date et rôle du dirigeant.\n3. Écarter toute fiche ambiguë ou de confiance inférieure à 60.\n4. Remplacer les libellés CGP-1 à CGP-3 par les noms des participants.\n5. Faire valider chaque message par le CGP avant contact.\n`;
};

export const generatePilotBatch = (csv: string, generatedAt = new Date()): PilotBatch => {
  const rows = parseInput(csv);
  const incompleteRows = rows
    .map((row) => ({ rowNumber: row.rowNumber, missing: missingFields(row) }))
    .filter((row) => row.missing.length > 0);
  const incompleteNumbers = new Set(incompleteRows.map((row) => row.rowNumber));
  const prospects = rows
    .filter((row) => !incompleteNumbers.has(row.rowNumber))
    .map((row): PilotProspect => {
      const rule = eventRule(row.eventType);
      const score = scoreProspect(row, generatedAt);
      return {
        ...row,
        id: `BATCH-001-P${String(row.rowNumber - 1).padStart(2, "0")}`,
        assignedCgp: `CGP-${Math.min(3, Math.floor((row.rowNumber - 2) / 5) + 1)}`,
        ...score,
        interpretation: rule.interpretation,
        missingInformation: [
          "Qualité d’actionnaire du dirigeant et pourcentage détenu à confirmer.",
          "Conséquence personnelle de l’événement non démontrée.",
          "Objectifs, calendrier et besoin de conseil à découvrir en entretien.",
        ],
        falsePositiveRisks: [
          rule.risk,
          "La source peut être incomplète, ancienne ou mal rattachée.",
        ],
        contactReason: rule.contactReason,
        contactAngle: rule.angle,
      };
    });

  return {
    prospects,
    incompleteRows,
    cardsMarkdown: cardsMarkdown(prospects, incompleteRows.length),
    outreachMarkdown: outreachMarkdown(prospects),
    summaryMarkdown: summaryMarkdown(prospects, incompleteRows),
    trackingCsv: trackingCsv(prospects),
  };
};
