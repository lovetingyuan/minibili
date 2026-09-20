import { describe, expect, it } from "vitest";

import { buildOpusDetailUrl, mapOpusDetail } from "./opus-detail.mapper";
import { OpusDetailResponseSchema } from "./opus-detail.schema";

function word(words: string, style?: Record<string, boolean>) {
  return { type: "TEXT_NODE_TYPE_WORD", word: { words, style: style ?? {} } };
}

function parse(item: unknown) {
  return mapOpusDetail(OpusDetailResponseSchema.parse({ item }));
}

function articleItem(paragraphs: unknown[], title = "韩国国歌变成朝鲜国歌") {
  return {
    id_str: "1250152752385884176",
    modules: [
      { module_type: "MODULE_TYPE_TITLE", module_title: { text: title } },
      {
        module_type: "MODULE_TYPE_CONTENT",
        module_content: { paragraphs },
      },
    ],
  };
}

describe("opus detail url", () => {
  it("carries the h5 query the web page uses", () => {
    const url = buildOpusDetailUrl("1250152752385884176");
    const [path, query] = url.split("?");
    const params = new URLSearchParams(query);

    expect(path).toBe("/x/polymer/web-dynamic/v1/opus/detail");
    expect(params.get("id")).toBe("1250152752385884176");
    expect(params.get("platform")).toBe("h5");
    expect(params.get("timezone_offset")).toBe("-480");
    expect(params.get("features")).toContain("onlyfansOpusCard");
    expect(params.get("features")).toContain("shareOpusNew");
  });
});

describe("opus detail mapping", () => {
  it("maps title, text, heading, picture and divider paragraphs", () => {
    const article = parse(
      articleItem([
        {
          para_type: 2,
          pic: { pics: [{ url: "http://i0.hdslb.com/a.jpg", width: 1270, height: 591 }] },
        },
        { para_type: 1, text: { nodes: [word("地球知识局", { bold: true })] } },
        { para_type: 8, heading: { level: 1, nodes: [word("住宿or荒野求生？")] } },
        { para_type: 3 },
      ]),
    );

    expect(article?.id).toBe("1250152752385884176");
    expect(article?.title).toBe("韩国国歌变成朝鲜国歌");
    expect(article?.paragraphs).toEqual([
      {
        kind: "images",
        images: [
          { src: "https://i0.hdslb.com/a.jpg", width: 1270, height: 591, ratio: 1270 / 591 },
        ],
      },
      {
        kind: "text",
        nodes: [
          {
            kind: "text",
            text: "地球知识局",
            bold: true,
            italic: false,
            underline: false,
            strikethrough: false,
          },
        ],
      },
      {
        kind: "heading",
        level: 1,
        nodes: [
          {
            kind: "text",
            text: "住宿or荒野求生？",
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          },
        ],
      },
      { kind: "divider" },
    ]);
  });

  it("maps rich nodes into links, emoji and mentions", () => {
    const article = parse(
      articleItem([
        {
          para_type: 1,
          text: {
            nodes: [
              word("见"),
              {
                type: "TEXT_NODE_TYPE_RICH",
                rich: {
                  type: "RICH_TEXT_NODE_TYPE_WEB",
                  text: "原文",
                  jump_url: "//www.bilibili.com/read/cv1",
                },
              },
              {
                type: "TEXT_NODE_TYPE_RICH",
                rich: {
                  type: "RICH_TEXT_NODE_TYPE_EMOJI",
                  text: "[笑]",
                  emoji: { icon_url: "http://i0.hdslb.com/emoji.png" },
                },
              },
              {
                type: "TEXT_NODE_TYPE_RICH",
                rich: { type: "RICH_TEXT_NODE_TYPE_AT", text: "@某人", rid: 42 },
              },
            ],
          },
        },
      ]),
    );

    expect(article?.paragraphs[0]).toEqual({
      kind: "text",
      nodes: [
        {
          kind: "text",
          text: "见",
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
        },
        { kind: "link", text: "原文", url: "https://www.bilibili.com/read/cv1" },
        { kind: "emoji", text: "[笑]", url: "https://i0.hdslb.com/emoji.png" },
        { kind: "at", text: "@某人", mid: 42 },
      ],
    });
  });

  it("falls back to plain text for quote, list and code paragraphs", () => {
    const article = parse(
      articleItem([
        { para_type: 4, blockquote: { children: [{ text: { nodes: [word("引用内容")] } }] } },
        { para_type: 5, list: { items: [{ nodes: [word("列表项")] }] } },
        { para_type: 7, code: { content: "const a = 1;" } },
      ]),
    );

    expect(article?.paragraphs).toEqual([
      {
        kind: "text",
        nodes: [
          {
            kind: "text",
            text: "引用内容",
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          },
        ],
      },
      {
        kind: "text",
        nodes: [
          {
            kind: "text",
            text: "列表项",
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          },
        ],
      },
      { kind: "text", nodes: [{ kind: "text", text: "const a = 1;" }] },
    ]);
  });

  it("ignores unknown paragraphs without failing to parse", () => {
    const article = parse(
      articleItem([
        { para_type: 99, future_field: { anything: true } },
        { para_type: 1, text: { nodes: [word("正文")] } },
      ]),
    );

    expect(article?.paragraphs).toHaveLength(1);
    expect(article?.paragraphs[0].kind).toBe("text");
  });

  it("returns null when the article is missing or has no body", () => {
    expect(parse(null)).toBeNull();
    expect(parse(articleItem([]))).toBeNull();
    expect(parse(articleItem([{ para_type: 2, pic: { pics: [] } }]))).toBeNull();
  });
});
