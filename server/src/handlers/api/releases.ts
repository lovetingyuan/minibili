import type { AppContext } from "../../types";

const RELEASES_FEED_URL = "https://github.com/lovetingyuan/minibili/releases.atom";

interface ReleaseItem {
  changelog: string;
  date: string;
  version: string;
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

function extractTagContent(source: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`);
  return source.match(pattern)?.[1]?.trim() ?? "";
}

function stripHtml(value: string) {
  return value
    .replaceAll(/<br\s*\/?>/g, "\n")
    .replaceAll(/<\/li>\s*<li>/g, "\n")
    .replaceAll(/<[^>]+>/g, "")
    .trim();
}

function parseChangelog(content: string) {
  const decoded = decodeHtmlEntities(content);
  const items = Array.from(decoded.matchAll(/<li>([\s\S]*?)<\/li>/g), (match) =>
    stripHtml(match[1] ?? ""),
  )
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length > 0) {
    return items.join("\n");
  }

  return stripHtml(decoded);
}

export function parseReleasesFeed(feed: string): ReleaseItem[] {
  return Array.from(feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g), (match) => match[1] ?? "")
    .map((entry) => ({
      changelog: parseChangelog(extractTagContent(entry, "content")),
      date: extractTagContent(entry, "updated"),
      version: decodeHtmlEntities(extractTagContent(entry, "title")),
    }))
    .filter((release) => release.version.length > 0);
}

async function handleGetReleases(c: AppContext) {
  const response = await fetch(RELEASES_FEED_URL, {
    headers: {
      Accept: "application/atom+xml, application/xml;q=0.9, text/xml;q=0.8",
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        code: response.status,
        message: "Failed to fetch releases",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: response.status,
      },
    );
  }

  const payload = parseReleasesFeed(await response.text());

  return c.json({
    code: 0,
    data: payload,
    message: "ok",
  });
}

export { handleGetReleases };
