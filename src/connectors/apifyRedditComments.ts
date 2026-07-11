import type { Comment, ScoredDiscussion } from "../types.js";

type UnknownRecord = Record<string, unknown>;

export interface CommentsConnectorOptions {
  readonly token: string;
  readonly actorId: string;
  readonly maxCommentsPerDiscussion: number;
  readonly minCommentScore: number;
}

export interface CommentsCollectionResult {
  comments: Comment[];
  rawItems: number;
  mappingIssues: number;
}

const stringValue = (item: UnknownRecord, ...keys: string[]): string => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string") return value;
  }
  return "";
};

const numberValue = (item: UnknownRecord, ...keys: string[]): number => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
      return Number(value);
  }
  return 0;
};

const normalizedId = (value: string): string => value.replace(/^t[13]_/, "");
const normalizedUrl = (value: string): string => value.split("?")[0]?.replace(/\/$/, "") ?? "";

const isoDate = (value: unknown): string => {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export class ApifyRedditCommentsConnector {
  readonly #options: CommentsConnectorOptions;

  constructor(options: CommentsConnectorOptions) {
    this.#options = options;
  }

  async collect(discussions: readonly ScoredDiscussion[]): Promise<CommentsCollectionResult> {
    const endpoint = new URL(
      `https://api.apify.com/v2/acts/${encodeURIComponent(this.#options.actorId)}/run-sync-get-dataset-items`,
    );
    endpoint.searchParams.set("timeout", "300");
    endpoint.searchParams.set("memory", "512");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.#options.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        postUrls: discussions.map((discussion) => discussion.url),
        maxComments: this.#options.maxCommentsPerDiscussion,
        minScore: this.#options.minCommentScore,
        expandThreads: true,
        excludeDeleted: true,
      }),
      signal: AbortSignal.timeout(305_000),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`L’Actor de commentaires Apify a répondu ${response.status}: ${details}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("Format Apify inattendu pour les commentaires.");

    const byId = new Map(
      discussions.map((discussion) => [normalizedId(discussion.id), discussion.id]),
    );
    const byUrl = new Map(
      discussions.map((discussion) => [normalizedUrl(discussion.url), discussion.id]),
    );
    const comments: Comment[] = [];
    let mappingIssues = 0;

    for (const item of payload.filter(
      (candidate): candidate is UnknownRecord =>
        candidate !== null && typeof candidate === "object",
    )) {
      const postId = normalizedId(stringValue(item, "postId", "post_id", "link_id"));
      const postUrl = normalizedUrl(stringValue(item, "postUrl", "post_url", "url"));
      const discussionId = byId.get(postId) ?? byUrl.get(postUrl);
      if (!discussionId) {
        mappingIssues += 1;
        continue;
      }

      const score = numberValue(item, "score", "upvotes", "ups");
      if (score < this.#options.minCommentScore) continue;
      const id = normalizedId(stringValue(item, "id", "commentId", "comment_id", "name"));
      const url = stringValue(item, "permalink", "commentUrl", "comment_url");
      comments.push({
        id: id || url,
        discussionId,
        parentId: stringValue(item, "parentId", "parent_id", "parentCommentId") || null,
        author: stringValue(item, "author", "username"),
        content: stringValue(item, "body", "contentText", "text", "content"),
        score,
        createdAt: isoDate(item["createdAt"] ?? item["created_utc"] ?? item["created_time"]),
        depth: numberValue(item, "depth", "commentDepth"),
        url,
      });
    }

    return { comments, rawItems: payload.length, mappingIssues };
  }
}
