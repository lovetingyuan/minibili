// 相同游标仍可能返回下一页；页序号区分缓存，代次隔离手动刷新前后的分页链。
export type CommentPaginationKey = readonly [url: string, page: number, generation: string];

export type CommentPaginationSession = { firstUrl: string | null; revision: number };

export type CommentPageUrlLoader<Page> = (index: number, previous: Page | null) => string | null;

export type CommentPagesUpdater<Page> = (pages: Page[] | undefined) => Page[] | undefined;
