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
  git_hash = 'git.hash',
  user_feedback = 'user.feedback',
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

export function reportUserOpenApp() {
  getLocation().then(loc => {
    const locationStr = [loc.country, loc.province, loc.city].join('/')
    SentryExpo.Native.setTag(Tags.user_location, locationStr)
    SentryExpo.Native.setContext('location', loc)
    SentryExpo.Native.captureMessage('Open app')
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

export function setScreenTag(name: string) {
  SentryExpo.Native.setTag(Tags.stack_route_name, name)
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
    tags: {
      [Tags.user_feedback]: 'UserFeedback',
    },
    extra: {
      message,
      contact,
    },
  })
}
