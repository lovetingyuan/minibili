const resultTimes = new WeakMap<object, number>();

/** 使用请求开始时间排序，较晚返回的旧请求不能覆盖新响应。 */
export function timestampPollResult<T extends object>(data: T, startedAt: number): T {
  resultTimes.set(data, startedAt);
  return data;
}

export function getPollResultTime(data: object): number {
  return resultTimes.get(data) ?? 0;
}
