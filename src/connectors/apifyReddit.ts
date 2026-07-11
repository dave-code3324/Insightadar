import type { Discussion } from "../types.js";

type UnknownRecord = Record<string, unknown>;

export interface ApifyRedditOptions {
  readonly token: string;
  readonly actorId: string;
  readonly resultsPerQuery: number;
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
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const redditUrl = (value: string): string => {
  if (value.startsWith("/")) return `https://www.reddit.com${value}`;
  return value;
};

const isoDate = (value: unknown): string => {
  if (typeof value !== "number" && typeof value !== "string") return "";
  const numeric = typeof value === "string" ? Number(value) : value;
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export class ApifyRedditConnector {
  readonly #options: ApifyRedditOptions;

  constructor(options: ApifyRedditOptions) {
    this.#options = options;
  }

  async search(query: string): Promise<Discussion[]> {
    const endpoint = new URL(
      `https://api.apify.com/v2/acts/${encodeURIComponent(this.#options.actorId)}/run-sync-get-dataset-items`,
    );
    endpoint.searchParams.set("timeout", "120");
    endpoint.searchParams.set("memory", "256");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.#options.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        search_type: "posts",
        search_query: query,
        search_limit: this.#options.resultsPerQuery,
      }),
      signal: AbortSignal.timeout(125_000),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`L’Actor Apify a répondu ${response.status}: ${details}`);
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Format Apify inattendu : la réponse doit être un tableau.");
    }

    return payload
      .filter((item): item is UnknownRecord => item !== null && typeof item === "object")
      .map((item, index) => this.normalize(item, query, index))
      .filter((discussion) => discussion.id !== "" || discussion.url !== "");
  }

  private normalize(item: UnknownRecord, query: string, index: number): Discussion {
    const permalink = stringValue(item, "permalink", "postUrl", "post_url");
    const externalUrl = stringValue(item, "url");
    const id = stringValue(item, "id", "postId", "post_id", "fullname");

    return {
      id: id || `apify-${query}-${index}`,
      source: "reddit",
      title: stringValue(item, "title", "postTitle"),
      content: stringValue(item, "selftext", "selfText", "body", "text", "content"),
      url: redditUrl(permalink || externalUrl),
      query,
      subreddit: stringValue(item, "subreddit", "subreddit_name_prefixed", "communityName"),
      author: stringValue(item, "author", "username"),
      score: numberValue(item, "score", "ups", "upVotes"),
      commentsCount: numberValue(item, "num_comments", "numComments", "numberOfComments"),
      createdAt: isoDate(
        item["created_utc"] ?? item["createdAt"] ?? item["created"] ?? item["timestamp"],
      ),
    };
  }
}
