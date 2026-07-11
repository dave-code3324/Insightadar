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

export interface Market {
  name: string;
  queries: readonly string[];
}
