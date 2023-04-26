import request from './fetcher'

// https://api.bilibili.com/x/web-interface/zone
export default function getLocation() {
  return request<{
    addr: string
    country: string
    province: string
    city: string
    isp: string
    latitude: number
    longitude: number
    zone_id: number
    country_code: number
  }>('/x/web-interface/zone?_t=' + Date.now()) //.then(data => {})
}
