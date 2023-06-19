import * as SentryExpo from 'sentry-expo'
import getLocation from '../api/get-location'
import { HandledDynamicTypeEnum } from '../api/dynamic-items.type'
import { ApiError } from '../api/fetcher'

export enum Tags {
  user_name = 'user.name',
  user_location = 'user.location',
  user_url = 'user.url',
  api_url = 'api.url',
  api_code = 'api.code',
  user_action = 'user.action',
  stack_route_name = 'route.stack',
  tab_route_name = 'route.tab',
  set_up_mid = 'up.mid',
  set_bvid = 'video.id',
  set_dynamic_id = 'dynamic.id',
}

export enum Action {
  add_black_user = 'add_black_user',
}

export function reportApiError(
  url: string,
  res: {
    code: number
    message: string
    data: any
  },
) {
  const path = url.split('?')[0]
  SentryExpo.Native.captureException(new ApiError(path, url, res), {
    contexts: {
      url: {
        value: url,
      },
      res,
    },
    tags: {
      [Tags.api_url]: path,
      [Tags.api_code]: res.code,
    },
  })
}

export function reportUserAction(action: Action, actionPayload: any = null) {
  SentryExpo.Native.captureMessage('User action', {
    tags: {
      'type.category': Tags.user_action,
      'user.action': action,
    },
    extra: {
      action,
      actionPayload,
    },
  })
}

export function reportUserLogout() {
  SentryExpo.Native.captureMessage('User Logout', {})
  clearUser()
}

export function reportUserLogin(mid: string | number, name: string) {
  setUser(mid, name)
  SentryExpo.Native.captureMessage('User login')
  // getLocation().then(loc => {
  //   const locationStr = [loc.country, loc.province, loc.city].join('/')
  //   SentryExpo.Native.setTag(Tags.user_location, locationStr)
  //   SentryExpo.Native.setContext('location', loc)
  // })
}

export function reportUserOpenApp(mid?: string | number, name?: string) {
  if (mid && name) {
    setUser(mid, name)
  }
  SentryExpo.Native.captureMessage('Open app')
  getLocation().then(loc => {
    const locationStr = [loc.country, loc.province, loc.city].join('/')
    SentryExpo.Native.setTag(Tags.user_location, locationStr)
    SentryExpo.Native.setContext('location', loc)
  })
}

export function setUser(mid: string | number, name: string) {
  SentryExpo.Native.setUser({ id: mid + '', username: name })
  SentryExpo.Native.setTag(Tags.user_url, `https://space.bilibili.com/${mid}`)
  SentryExpo.Native.setTag(Tags.user_name, name)
}

export function clearUser() {
  SentryExpo.Native.setUser(null)
  SentryExpo.Native.setTags({
    [Tags.user_url]: null,
    [Tags.user_name]: null,
    [Tags.user_location]: null,
  })
}

export function reportUnknownDynamicItem(item: any) {
  let type = item.type
  if (type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    type = 'FORWARD:' + item.orig?.type
  }
  SentryExpo.Native.captureMessage('unknown dynamic item:' + type, {
    extra: {
      dynamicItem: JSON.stringify(item, null, 2),
    },
  })
}

export function reportUnknownRichTextItem(item: any) {
  const type = item.type
  SentryExpo.Native.captureMessage('unknown rich text item:' + type, {
    extra: {
      dynamicItem: JSON.stringify(item, null, 2),
    },
  })
}

export function reportUnknownAdditional(item: any) {
  SentryExpo.Native.captureMessage(
    'item additional:' +
      item.type +
      '@' +
      item.modules.module_dynamic.additional.type,
    {
      extra: {
        dynamicItem: JSON.stringify(item, null, 2),
      },
    },
  )
}

export function setScreenTag(name: string, type: 'tab' | 'stack') {
  SentryExpo.Native.setTag(
    type === 'tab' ? Tags.tab_route_name : Tags.stack_route_name,
    name,
  )
}

export function setViewingUpMid(mid: string | number | null) {
  SentryExpo.Native.setTag(Tags.set_up_mid, mid)
}

export function setViewingVideoId(bvid: string | null) {
  SentryExpo.Native.setTag(Tags.set_bvid, bvid)
}

export function setViewingDynamicId(id: string | null) {
  SentryExpo.Native.setTag(Tags.set_dynamic_id, id)
}

export function reportUserFeedback(message: string, contact?: string) {
  SentryExpo.Native.captureMessage('User Feedback', {
    extra: {
      message,
      contact,
    },
  })
}
