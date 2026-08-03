import { NextResponse } from "next/server";

const USER = "wizardamxn";

type SearchItem = {
  sha: string;
  repository?: { name?: string };
  commit?: { message?: string; author?: { date?: string } };
};

export type CommitLine = {
  sha: string;
  repo: string;
  message: string;
  date: string;
};

/**
 * Recent public commits, for the in-game terminal's `git log`.
 *
 * Uses the commit SEARCH endpoint rather than /users/:user/events/public —
 * the events API's PushEvent payload no longer carries a `commits` array
 * (it's now just repository_id/push_id/ref/head/before), so events can tell
 * you that a push happened but not what was in it. Search returns the message,
 * repo and date across every repo in a single call.
 *
 * Proxied server-side so the request isn't subject to CORS and doesn't burn the
 * visitor's own rate limit — search is only ~10 req/min unauthenticated, hence
 * the generous revalidate window below.
 */
export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/search/commits?q=author:${USER}&sort=author-date&order=desc&per_page=15`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "snow-portfolio",
        },
        next: { revalidate: 900 },
      }
    );
    if (!res.ok) return NextResponse.json({ available: false, commits: [] });

    const data = (await res.json()) as { items?: SearchItem[] };
    const commits: CommitLine[] = (data.items ?? []).map((i) => ({
      sha: i.sha.slice(0, 7),
      repo: i.repository?.name ?? "unknown",
      message: (i.commit?.message ?? "").split("\n")[0].slice(0, 64),
      date: (i.commit?.author?.date ?? "").slice(0, 10),
    }));

    return NextResponse.json({ available: commits.length > 0, commits });
  } catch {
    return NextResponse.json({ available: false, commits: [] });
  }
}
