export type FollowingsFetcher = (url: string) => Promise<unknown>;
export type FollowingsKey = readonly ["bilibili-followings", string, number];
