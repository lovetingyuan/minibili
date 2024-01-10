import useSWR from 'swr'
import request from './fetcher'
import encWbi from '../utils/wbi'

export function useWbiQuery(params: Record<string, any> | null) {
  const { data } = useSWR<{
    isLogin: boolean
    wbi_img: {
      img_url: string
      sub_url: string
    }
  }>(params ? '/x/web-interface/nav' : null, request, {
    dedupingInterval: 12 * 60 * 60 * 1000,
  })
  if (data && params) {
    const {
      wbi_img: { img_url, sub_url },
    } = data
    const query = encWbi(params, img_url, sub_url)
    return query
  }
  return ''
}
