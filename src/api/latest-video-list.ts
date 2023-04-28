// api.bilibili.com/x/web-interface/dynamic/region
import useSWR from 'swr'
export function useLatestVideosList(rid: number) {
  const { data } = useSWR(
    `/x/web-interface/dynamic/region?rid=${rid}&ps=50&pn=1`,
  )
  return { data }
}
