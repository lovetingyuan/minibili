import useSWRInfinite from "swr/infinite";

import type {
  BaseCommentResItem,
  CommentCursor,
  CommentResItem,
  CommentResponse,
} from "./comments.schema";
import fetcher from "./fetcher";

const urlReg = /(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+)/;

export const parseCommentMessage = (content: CommentResItem["content"]) => {
  let keys: string[] = [];
  let message = content.message;
  const emojiMap: Record<
    string,
    {
      id: number;
      url: string;
      text: string;
    }
  > = {};
  const atMap: Record<string, { mid: number; name: string }> = {};
  if (content.emote) {
    Object.keys(content.emote).forEach((emoji) => {
      const id = `emoji${Math.random().toString().substring(2)}`;
      emojiMap[id] = content.emote![emoji];
      message = message.replaceAll(emoji, id);
      keys.push(id);
    });
  }
  if (content.at_name_to_mid) {
    Object.keys(content.at_name_to_mid).forEach((name) => {
      const id = `@${Math.random().toString().substring(2)}`;
      atMap[id] = {
        mid: content.at_name_to_mid![name],
        name: `@${name}`,
      };
      message = message.replaceAll(`@${name}`, id);
      keys.push(id);
    });
  }
  if (content.jump_url) {
    Object.keys(content.jump_url).forEach((bvid) => {
      if (bvid.startsWith("BV")) {
        keys.push(bvid);
      }
    });
  }
  if (content.vote) {
    keys.push(`{vote:${content.vote.id}}`);
  }
  keys = keys.filter(Boolean);
  if (keys.length) {
    const reg = new RegExp(`(${keys.join("|")})`);
    return message
      .split(reg)
      .map((part, i) => {
        if (i % 2) {
          if (part[0] === "@" && atMap[part]) {
            return {
              type: "at" as const,
              text: atMap[part].name,
              mid: atMap[part].mid,
            };
          }

          if (part.startsWith("{vote:") && part.endsWith("}")) {
            return {
              type: "vote" as const,
              text: content.vote?.title,
              url: content.vote?.url,
            };
          }
          if (part.startsWith("emoji")) {
            return {
              type: "emoji" as const,
              url: emojiMap[part].url,
            };
          }
          if (content.jump_url && part in content.jump_url) {
            return {
              type: "av" as const,
              text: content.jump_url[part].title,
              url: `https://b23.tv/${part}`,
            };
          }
        }
        if (!part) {
          return null;
        }
        return part.split(urlReg).map((part2, j) => {
          return j % 2
            ? {
                type: "url" as const,
                url: part2,
              }
            : {
                type: "text" as const,
                text: part2,
              };
        });
      })
      .filter((v) => !!v && typeof v === "object")
      .flat();
  }
  return content.message.split(urlReg).map((part2, j) => {
    return j % 2
      ? {
          type: "url" as const,
          url: part2,
        }
      : {
          type: "text" as const,
          text: part2,
        };
  });
};
export type CommentMessageContent = ReturnType<typeof parseCommentMessage>;

export const getReplyItem = (item: BaseCommentResItem, type = item.type) => {
  return {
    message: parseCommentMessage(item.content),
    images:
      item.content.pictures?.map((img) => {
        return {
          src: img.img_src,
          width: img.img_width,
          height: img.img_height,
          ratio: img.img_width / img.img_height,
        };
      }) || [],
    name: item.member.uname,
    mid: item.member.mid,
    face: item.member.avatar,
    sign: item.member.sign,
    id: item.rpid_str,
    oid: item.oid,
    root: item.root,
    root_str: item.root_str,
    rcount: item.rcount,
    upLike: item.up_action.like,
    moreText: item.reply_control.sub_reply_entry_text,
    location: item.reply_control.location,
    time: item.reply_control.time_desc,
    top: false,
    like: item.like,
    sex: item.member.sex,
    type,
    replies: [],
  };
};

export type ReplyItemType = ReturnType<typeof getReplyItem>;

const getCommentItem = (item: CommentResItem, type: number, top: boolean) => {
  return {
    ...getReplyItem(item, type),
    top,
    replies: item.replies?.map((reply) => getReplyItem(reply, type)) || [],
  };
};

export const getComments = (response: CommentResponse, type: number) => {
  const replies = (response.replies || [])
    .filter((item) => !item.invisible)
    .map((item) => getCommentItem(item, type, false));
  if (response.top?.upper) {
    replies.unshift(getCommentItem(response.top.upper, type, true));
  }
  return replies;
};

export type CommentItemType = ReturnType<typeof getComments>[0];

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
  return `/x/v2/reply/wbi/main?oid=${oid}&type=${type}&mode=${mode}&pagination_str=${pagination}&plat=1&seek_rpid=&web_location=1315875`;
}

// https://api.bilibili.com/x/v2/reply/main?csrf=dec0b143f0b4817a39b305dca99a195c&mode=3&next=4&oid=259736997&plat=1&type=1

export function useComments(oid: string | number, type: number, mode = 3) {
  const { data, error, size, setSize, isValidating, isLoading } = useSWRInfinite<CommentResponse>(
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
    fetcher,
  );
  // const isLoadingMore =
  //   isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')
  // const isEmpty = data?.[0]?.replies.length === 0
  // const isReachingEnd =
  //   isEmpty || (data && data[data.length - 1]?.replies.length === 0)
  // const isRefreshing = isValidating && data && data.length === size
  const uniqueMap: Record<string, boolean> = {};
  const list =
    data?.reduce((a, b) => {
      return a.concat(getComments(b, type));
    }, [] as CommentItemType[]) || [];
  const replies: CommentItemType[] = [];
  for (const r of list) {
    if (!uniqueMap[r.id]) {
      uniqueMap[r.id] = true;
      replies.push(r);
    }
  }
  const lastPage = data?.[data.length - 1];
  const isPageEnd =
    !!lastPage && (lastPage.cursor.is_end || !lastPage.cursor.pagination_reply?.next_offset);
  const isReachingEnd = !!error || isPageEnd;
  const allCount = data?.[0]?.cursor.all_count;
  const isLimited = typeof allCount === "number" && allCount > replies.length && isReachingEnd;
  return {
    data: {
      allCount,
      replies,
    },
    isLoading,
    update: () => {
      if (isLoading || isValidating || isReachingEnd || error) {
        return;
      }
      setSize(size + 1);
    },
    isValidating,
    isLimited,
    isReachingEnd,
    error,
  };
}
