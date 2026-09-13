import useSWRInfinite from "swr/infinite";

import type { CommentAttitude } from "./comment-actions.types";
import { CommentResponseSchema } from "./comments.schema";
import type {
  BaseCommentResItem,
  CommentCursor,
  CommentResItem,
  CommentResponse,
} from "./comments.schema";
import type {
  CommentItemType,
  CommentMessageContent,
  CommentsPage,
  ReplyItemType,
} from "./comments.types";
import fetcher from "./fetcher";

const urlReg = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/;

function parseCommentMessage(content: CommentResItem["content"]): CommentMessageContent {
  const replacements = new Map<string, CommentMessageContent[number]>();
  let message = content.message;
  let tokenIndex = 0;

  function replace(source: string, node: CommentMessageContent[number]) {
    const token = `\uE000${tokenIndex}\uE001`;
    tokenIndex += 1;
    replacements.set(token, node);
    message = message.replaceAll(source, token);
  }

  Object.entries(content.emote || {}).forEach(([emoji, value]) => {
    replace(emoji, { type: "emoji", url: value.url });
  });
  Object.entries(content.at_name_to_mid || {}).forEach(([name, mid]) => {
    replace(`@${name}`, { type: "at", text: `@${name}`, mid });
  });
  Object.entries(content.jump_url || {}).forEach(([bvid, jump]) => {
    if (bvid.startsWith("BV")) {
      replace(bvid, { type: "av", text: jump.title, url: `https://b23.tv/${bvid}` });
    }
  });
  if (content.vote) {
    replace(`{vote:${content.vote.id}}`, {
      type: "vote",
      text: content.vote.title,
      url: content.vote.url,
    });
  }

  const tokenReg = /(\uE000\d+\uE001)/;
  return message.split(tokenReg).flatMap((part) => {
    const replacement = replacements.get(part);
    if (replacement) return [replacement];
    return part.split(urlReg).flatMap((text, index): CommentMessageContent => {
      if (!text) return [];
      if (index % 2) return [{ type: "url" as const, url: text }];
      return [{ type: "text" as const, text }];
    });
  });
}

function getAttitude(action: BaseCommentResItem["action"]): CommentAttitude {
  return action === 1 ? "like" : action === 2 ? "dislike" : "none";
}

export function getReplyItem(item: BaseCommentResItem, type = item.type): ReplyItemType {
  return {
    message: parseCommentMessage(item.content),
    images:
      item.content.pictures?.map((image) => ({
        src: image.img_src,
        width: image.img_width,
        height: image.img_height,
        ratio: image.img_width / image.img_height,
      })) || [],
    name: item.member.uname,
    mid: item.member.mid,
    face: item.member.avatar,
    sign: item.member.sign,
    id: item.rpid_str,
    oid: item.oid,
    root: item.root_str || item.root,
    root_str: item.root_str,
    rcount: item.rcount,
    attitude: getAttitude(item.action),
    creatorLiked: item.up_action.like,
    moreText: item.reply_control.sub_reply_entry_text,
    location: item.reply_control.location,
    time: item.reply_control.time_desc,
    top: false,
    like: item.like,
    sex: item.member.sex,
    type,
    replies: [],
  };
}

function getCommentItem(item: CommentResItem, type: number, top: boolean): CommentItemType {
  return {
    ...getReplyItem(item, type),
    top,
    replies: item.replies?.map((reply) => getReplyItem(reply, type)) || [],
  };
}

export function getComments(response: CommentResponse, type: number) {
  const replies: CommentItemType[] = [];
  for (const item of response.replies || []) {
    if (!item.invisible) replies.push(getCommentItem(item, type, false));
  }
  if (response.top?.upper) replies.unshift(getCommentItem(response.top.upper, type, true));
  return replies;
}

export function getCommentsPageUrl(
  oid: string | number,
  type: number,
  mode: number,
  previousCursor?: Pick<CommentCursor, "is_end" | "pagination_reply">,
) {
  if (!oid || previousCursor?.is_end) return null;
  const offset = previousCursor?.pagination_reply?.next_offset;
  if (previousCursor && !offset) return null;
  const pagination = encodeURIComponent(JSON.stringify({ offset: offset || "" }));
  return `/x/v2/reply/wbi/main?oid=${oid}&type=${type}&mode=${mode}&pagination_str=${pagination}&plat=1&seek_rpid=`;
}

export function transitionCommentAttitude(
  item: ReplyItemType,
  nextAttitude: CommentAttitude,
): ReplyItemType {
  const likeDelta = (nextAttitude === "like" ? 1 : 0) - (item.attitude === "like" ? 1 : 0);
  return { ...item, attitude: nextAttitude, like: Math.max(0, item.like + likeDelta) };
}

export function patchCommentTree(
  item: CommentItemType,
  id: string,
  update: (comment: ReplyItemType) => ReplyItemType,
): CommentItemType {
  if (item.id === id) return { ...item, ...update(item) };
  let changed = false;
  const replies = item.replies.map((reply) => {
    if (reply.id !== id) return reply;
    changed = true;
    return update(reply);
  });
  return changed ? { ...item, replies } : item;
}

async function fetchCommentsPage(url: string, type: number): Promise<CommentsPage> {
  const payload = await fetcher<unknown>(url);
  const response = CommentResponseSchema.parse(payload);
  return {
    cursor: response.cursor,
    replies: getComments(response, type),
    ownerMid: String(response.upper.mid),
  };
}

export function mergeCommentPages(
  pages?: readonly Pick<CommentsPage, "replies">[],
): CommentItemType[] {
  const ids = new Set<string>();
  const replies: CommentItemType[] = [];
  pages?.forEach((page) => {
    page.replies.forEach((reply) => {
      if (!ids.has(reply.id)) {
        ids.add(reply.id);
        replies.push(reply);
      }
    });
  });
  return replies;
}

export function useComments(oid: string | number, type: number, mode = 3) {
  const { data, error, size, setSize, mutate, isValidating, isLoading } =
    useSWRInfinite<CommentsPage>(
      (index, previousPageData) => {
        if (index > 0 && !previousPageData) return null;
        return getCommentsPageUrl(
          oid,
          type,
          mode,
          index === 0 ? undefined : previousPageData?.cursor,
        );
      },
      (url: string) => fetchCommentsPage(url, type),
      { revalidateFirstPage: false },
    );

  const replies = mergeCommentPages(data);
  const lastPage = data?.[data.length - 1];
  const isPageEnd =
    !!lastPage && (lastPage.cursor.is_end || !lastPage.cursor.pagination_reply?.next_offset);
  const isReachingEnd = !!error || isPageEnd;
  const allCount = data?.[0]?.cursor.all_count;
  const isLimited = typeof allCount === "number" && allCount > replies.length && isReachingEnd;
  const isLoadingMore = Boolean(data && size > data.length);

  async function patchAttitude(id: string, next: CommentAttitude) {
    await mutate(
      (pages) =>
        pages?.map((page) => ({
          ...page,
          replies: page.replies.map((reply) =>
            patchCommentTree(reply, id, (item) => transitionCommentAttitude(item, next)),
          ),
        })),
      { revalidate: false },
    );
  }

  async function prependReply(rootId: string, reply: ReplyItemType) {
    await mutate(
      (pages) =>
        pages?.map((page) => ({
          ...page,
          replies: page.replies.map((comment) =>
            comment.id === rootId
              ? { ...comment, rcount: comment.rcount + 1, replies: [reply, ...comment.replies] }
              : comment,
          ),
        })),
      { revalidate: false },
    );
  }

  return {
    data: { allCount, replies, ownerMid: data?.[0]?.ownerMid },
    isLoading,
    update() {
      if (isLoading || isValidating || isReachingEnd || error) return;
      void setSize((current) => current + 1);
    },
    isValidating,
    isRefreshing: isValidating && Boolean(data) && !isLoadingMore,
    async refresh() {
      await setSize(1);
      await mutate();
    },
    patchAttitude,
    prependReply,
    isLimited,
    isReachingEnd,
    error,
  };
}

export type {
  CommentImage,
  CommentItemType,
  CommentMessageContent,
  ReplyItemType,
} from "./comments.types";
