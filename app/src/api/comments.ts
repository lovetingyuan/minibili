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
      replace(bvid, { type: "av", text: jump.title || bvid, url: `https://b23.tv/${bvid}` });
    }
  });
  if (content.vote) {
    replace(`{vote:${content.vote.id}}`, {
      type: "vote",
      text: content.vote.title ?? undefined,
      url: content.vote.url ?? undefined,
    });
  }

  const tokenReg = /(\uE000\d+\uE001)/;
  return message.split(tokenReg).flatMap((part) => {
    const replacement = replacements.get(part);
    if (replacement) {
      return [replacement];
    }
    return part.split(urlReg).flatMap((text, index): CommentMessageContent => {
      if (!text) {
        return [];
      }
      if (index % 2) {
        return [{ type: "url" as const, url: text }];
      }
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
      item.content.pictures?.map((image) => {
        // 商品卡片之类的图片没有宽高，按正方形兜底，避免算出 NaN/Infinity。
        const width = image.img_width ?? 0;
        const height = image.img_height ?? width;
        return {
          src: image.img_src,
          width,
          height,
          ratio: width > 0 && height > 0 ? width / height : 1,
        };
      }) || [],
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
    if (!item.invisible) {
      replies.push(getCommentItem(item, type, false));
    }
  }
  if (response.top?.upper) {
    replies.unshift(getCommentItem(response.top.upper, type, true));
  }
  return replies;
}

export function getCommentsPageUrl(
  oid: string | number,
  type: number,
  mode: number,
  previousCursor?: Pick<CommentCursor, "is_end" | "pagination_reply">,
) {
  if (!oid || previousCursor?.is_end) {
    return null;
  }
  const offset = previousCursor?.pagination_reply?.next_offset;
  if (previousCursor && !offset) {
    return null;
  }
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
  if (item.id === id) {
    return { ...item, ...update(item) };
  }
  let changed = false;
  const replies = item.replies.map((reply) => {
    if (reply.id !== id) {
      return reply;
    }
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

/**
 * 新发表的评论排在列表首位，同时把第一页的评论总数加一，与网页端行为一致。
 */
export function prependCommentToPages(
  pages: readonly CommentsPage[] | undefined,
  comment: ReplyItemType,
): CommentsPage[] | undefined {
  return pages?.map((page, index) =>
    index === 0
      ? {
          ...page,
          cursor: { ...page.cursor, all_count: page.cursor.all_count + 1 },
          replies: [comment, ...page.replies],
        }
      : page,
  );
}

/**
 * 删除评论后的本地同步：删主评论时列表总数减一，删楼中楼时对应主评论的回复数减一。
 */
export function removeCommentFromPages(
  pages: readonly CommentsPage[] | undefined,
  target: Pick<ReplyItemType, "id" | "root">,
): CommentsPage[] | undefined {
  if (!pages) {
    return undefined;
  }
  const deletingRoot = String(target.root) === "0";
  const rootId = deletingRoot ? target.id : String(target.root);
  const rootExists = pages.some((page) => page.replies.some((comment) => comment.id === rootId));
  if (!rootExists) {
    return [...pages];
  }

  return pages.map((page, pageIndex) => {
    const replies = deletingRoot
      ? page.replies.filter((comment) => comment.id !== target.id)
      : page.replies.map((comment) =>
          comment.id === rootId
            ? {
                ...comment,
                rcount: Math.max(0, comment.rcount - 1),
                replies: comment.replies.filter((reply) => reply.id !== target.id),
              }
            : comment,
        );
    const cursor =
      deletingRoot && pageIndex === 0
        ? { ...page.cursor, all_count: Math.max(0, page.cursor.all_count - 1) }
        : page.cursor;
    if (
      replies.length === page.replies.length &&
      replies.every((reply, index) => reply === page.replies[index]) &&
      cursor === page.cursor
    ) {
      return page;
    }
    return { ...page, cursor, replies };
  });
}

export function useComments(oid: string | number, type: number, mode = 3) {
  const { data, error, size, setSize, mutate, isValidating, isLoading } =
    useSWRInfinite<CommentsPage>(
      (index, previousPageData) => {
        if (index > 0 && !previousPageData) {
          return null;
        }
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
  const allCount = data?.[0]?.cursor.all_count;
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

  async function prependComment(comment: ReplyItemType) {
    await mutate((pages) => prependCommentToPages(pages, comment), { revalidate: false });
  }

  async function removeComment(target: Pick<ReplyItemType, "id" | "root">) {
    await mutate((pages) => removeCommentFromPages(pages, target), { revalidate: false });
  }

  return {
    data: { allCount, replies, ownerMid: data?.[0]?.ownerMid },
    isLoading,
    update() {
      if (isLoading || isValidating || isPageEnd || error) {
        return;
      }
      void setSize((current) => current + 1);
    },
    async retry() {
      await setSize(size);
    },
    isValidating,
    isRefreshing: isValidating && Boolean(data) && !isLoadingMore,
    async refresh() {
      await setSize(1);
      await mutate();
    },
    patchAttitude,
    prependReply,
    prependComment,
    removeComment,
    isPageEnd,
    error,
  };
}

export type {
  CommentImage,
  CommentItemType,
  CommentMessageContent,
  ReplyItemType,
} from "./comments.types";
