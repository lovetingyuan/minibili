import { bilibiliSession } from "../bilibili-session/session";
import { createRelationMutationController } from "./mutations";

// 关注、取消关注和拉黑共用同一个账号级请求锁。
export const relationMutations = createRelationMutationController(bilibiliSession.isCurrentAccount);
