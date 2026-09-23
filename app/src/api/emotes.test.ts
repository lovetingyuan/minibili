import { describe, expect, test } from "vitest";

import { buildEmotePackagesUrl, mapEmotePackages } from "./emotes";
import { EmotePackagesResponseSchema } from "./emotes.schema";

describe("emote packages", () => {
  test("requests the default emote packages of the dynamic business", () => {
    const url = buildEmotePackagesUrl();
    const query = new URLSearchParams(url.split("?")[1]);

    expect(url).toContain("/x/emote/package?");
    expect(query.get("business")).toBe("dynamic");
    expect(query.get("ids")?.split(",")).toEqual(
      Array.from({ length: 25 }, (_, index) => `${index + 1}`),
    );
  });

  test("maps emote text to an https icon url and keeps the first hit", () => {
    const response = EmotePackagesResponseSchema.parse({
      setting: { recent_limit: 150 },
      packages: [
        {
          id: 1,
          text: "小黄脸",
          emote: [
            { text: "[大哭]", url: "http://i0.hdslb.com/bfs/emote/daku.png" },
            { text: "[doge]", url: "//i0.hdslb.com/bfs/emote/doge.png" },
            { text: "", url: "https://i0.hdslb.com/bfs/emote/empty.png" },
            { text: "[坏数据]" },
          ],
        },
        {
          id: 2,
          text: "tv_小电视",
          emote: [
            { text: "[doge]", url: "https://i0.hdslb.com/bfs/emote/other-doge.png" },
            { text: "[tv_doge]", url: "https://i0.hdslb.com/bfs/emote/tv-doge.png" },
          ],
        },
      ],
    });

    const emotes = mapEmotePackages(response);

    expect(emotes.get("[大哭]")).toBe("https://i0.hdslb.com/bfs/emote/daku.png");
    expect(emotes.get("[doge]")).toBe("https://i0.hdslb.com/bfs/emote/doge.png");
    expect(emotes.get("[tv_doge]")).toBe("https://i0.hdslb.com/bfs/emote/tv-doge.png");
    expect(emotes.has("")).toBe(false);
    expect(emotes.has("[坏数据]")).toBe(false);
  });

  test("tolerates a null package list", () => {
    const response = EmotePackagesResponseSchema.parse({ packages: null });

    expect(mapEmotePackages(response).size).toBe(0);
  });
});
