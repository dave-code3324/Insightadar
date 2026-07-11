export interface Discussion {
  id: string;
  source: "reddit";
  title: string;
  content: string;
  url: string;
  query: string;
  subreddit: string;
  author: string;
  score: number;
  commentsCount: number;
  createdAt: string;
}

export interface ScoredDiscussion extends Discussion {
  relevanceScore: number;
  relevanceReasons: string[];
  isRelevant: boolean;
}

export interface Comment {
  id: string;
  discussionId: string;
  parentId: string | null;
  author: string;
  content: string;
  score: number;
  createdAt: string;
  depth: number;
  url: string;
}

export interface RelevanceReport {
  totalDiscussions: number;
  retainedDiscussions: number;
  relevanceRate: number;
  threshold: number;
  mainExclusionReasons: Array<{ reason: string; count: number }>;
  scoreDistribution: Record<string, number>;
  topDiscussions: ScoredDiscussion[];
  likelyFalsePositives: ScoredDiscussion[];
  likelyFalseNegatives: ScoredDiscussion[];
  exclusionRuleContributions: Array<{ rule: string; count: number }>;
  relevantBySubreddit: Record<string, number>;
  relevantByQuery: Record<string, number>;
  reviewSample: Array<{
    title: string;
    subreddit: string;
    score: number;
    decision: "retained" | "excluded";
    positiveReasons: string[];
    negativeReasons: string[];
  }>;
}

export interface Market {
  name: string;
  queries: readonly string[];
}
