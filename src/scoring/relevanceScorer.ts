import type { Discussion, ScoredDiscussion } from "../types.js";

export const RELEVANCE_THRESHOLD = 60;

interface Rule {
  readonly reason: string;
  readonly points: number;
  readonly patterns: readonly RegExp[];
  readonly target?: "text" | "subreddit";
}

const positiveRules: readonly Rule[] = [
  {
    reason: "marché: conseiller financier / wealth management / RIA / CFP",
    points: 35,
    patterns: [
      /\bfinancial advisors?\b/i,
      /\bwealth advisors?\b/i,
      /\bwealth management\b/i,
      /\bregistered investment advisors?\b/i,
      /\bRIA\b/,
      /\bCFP\b/,
      /\bfinancial planners?\b/i,
    ],
  },
  {
    reason: "communauté métier spécialisée",
    points: 30,
    target: "subreddit",
    patterns: [/^(cfp|financialadvisors|financialplanning|wealthmanagement|series7exam)$/i],
  },
  {
    reason: "problème ou frustration explicite",
    points: 20,
    patterns: [
      /\b(problem|pain|struggl\w*|frustrat\w*|challenge\w*|difficult|manual|stuck)\b/i,
      /\b(too expensive|time[- ]consuming|waste of time|doesn'?t work|wish it|hate)\b/i,
    ],
  },
  {
    reason: "outil, logiciel ou workflow",
    points: 20,
    patterns: [
      /\b(CRM|software|tool|platform|workflow|automation|integration|technology|tech stack)\b/i,
      /\b(wealthbox|redtail|salesforce|hubspot|orion|emoney|advyzon|nitrogen)\b/i,
    ],
  },
  {
    reason: "acquisition, prospection ou développement commercial",
    points: 20,
    patterns: [
      /\b(prospect\w*|lead generation|client acquisition|referral\w*|pipeline|marketing)\b/i,
      /\b(grow(?:ing)? (?:my|the|your) (?:book|practice)|finding clients?|new clients?)\b/i,
    ],
  },
  {
    reason: "demande de recommandation ou d’alternative",
    points: 10,
    patterns: [
      /\b(best|recommend\w*|alternative|what do you use|anyone use|how do you)\b/i,
      /\b(looking for|need a|which (?:CRM|software|tool))\b/i,
    ],
  },
];

const negativeRules: readonly Rule[] = [
  {
    reason: "exclusion: carrière, recrutement ou emploi",
    points: -50,
    patterns: [
      /\b(job|jobs|career|salary|compensation|resume|résumé|hiring|recruit\w*|interview|internship|graduate|unemployed)\b/i,
      /\b(joining an RIA|career move|years? of experience|YoE)\b/i,
    ],
  },
  {
    reason: "exclusion: examen, certification ou formation",
    points: -45,
    patterns: [
      /\b(exam|certification|study|studying|passed|course|degree|college|university)\b/i,
      /\b(series 7|series7|CFP exam)\b/i,
    ],
  },
  {
    reason: "exclusion: investissement ou finances personnelles",
    points: -45,
    patterns: [
      /\b(my portfolio|my 401k|my 401K|rebalance|stock|stocks|dividend|investing|investment advice)\b/i,
      /\b(ETF|crypto|bitcoin|mortgage|credit card|retirement account|personal finance)\b/i,
    ],
  },
  {
    reason: "exclusion: communauté hors marché ou promotionnelle",
    points: -60,
    target: "subreddit",
    patterns: [
      /(?:jobs?|careers?|resumes?|exam|wallstreetbets|superstonk|stocks?|investing|gme|pennystocks)/i,
      /^(bestofredditorupdates|collapse|nba|books|history|facepalm|sexyspacebabes)$/i,
      /^(bookwritingsoftwares|actorreviews|promptengineering|rksterling|jugl|edgar_news|startups_promotion|baylenoutloud|fpanda|tanonglang)$/i,
      /^u_/i,
    ],
  },
  {
    reason: "exclusion: contenu promotionnel ou vendeur",
    points: -35,
    patterns: [
      /\b(I built|free demo|book a demo|offered|sponsorship|selling lead gen services)\b/i,
      /\b(boost client|designed to convert|our platform|our solution|we built)\b/i,
    ],
  },
];

const matches = (patterns: readonly RegExp[], value: string): boolean =>
  patterns.some((pattern) => pattern.test(value));

export const scoreDiscussion = (discussion: Discussion): ScoredDiscussion => {
  const text = `${discussion.title}\n${discussion.content}`;
  const reasons: string[] = [];
  let score = 0;

  for (const rule of [...positiveRules, ...negativeRules]) {
    const value = rule.target === "subreddit" ? discussion.subreddit : text;
    if (!matches(rule.patterns, value)) continue;
    score += rule.points;
    reasons.push(`${rule.points > 0 ? "+" : ""}${rule.points} ${rule.reason}`);
  }

  if (discussion.commentsCount >= 5) {
    score += 5;
    reasons.push("+5 discussion active (au moins 5 commentaires)");
  }

  const hasProductSignal = reasons.some((reason) =>
    /problème|outil|acquisition|recommandation/.test(reason),
  );
  if (!hasProductSignal && score > 55) {
    score = 55;
    reasons.push("plafond 55: aucun problème, outil, workflow ou besoin produit détecté");
  }

  const relevanceScore = Math.max(0, Math.min(100, score));
  if (reasons.length === 0) reasons.push("0 aucun signal produit ou métier détecté");

  return {
    ...discussion,
    relevanceScore,
    relevanceReasons: reasons,
    isRelevant: relevanceScore >= RELEVANCE_THRESHOLD,
  };
};
