import { describe, expect, test } from "vitest";

import { parseReleasesFeed } from "./releases";

describe("parseReleasesFeed", () => {
  test("maps atom feed entries to app release payload", () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>minibili-0.7.0</title>
    <updated>2025-07-13T08:27:29Z</updated>
    <content type="html">&lt;ul&gt;
&lt;li&gt;动态页面改版&lt;/li&gt;
&lt;li&gt;修复已知问题&lt;/li&gt;
&lt;/ul&gt;</content>
  </entry>
</feed>`;

    expect(parseReleasesFeed(feed)).toEqual([
      {
        changelog: "动态页面改版\n修复已知问题",
        date: "2025-07-13T08:27:29Z",
        version: "minibili-0.7.0",
      },
    ]);
  });
});
