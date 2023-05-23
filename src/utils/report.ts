import * as SentryExpo from 'sentry-expo'
import getLocation from '../api/get-location'
import { HandledDynamicTypeEnum } from '../api/dynamic-items.type'

enum ReportType {
  USER_ACTION = 'user_action',
  USER_DATA = 'user_data',
  API = 'api',
}

enum Category {
  API_ERR = 'api.error',
  NAVIGATION = 'action.navigation',
  LOGIN = 'action.login',
  LOCATION = 'data.location',
  COMMON_ACTION = 'action.common',
  UNKNOWN_ITEM = 'data.unknownitem',
  UNKNOWN_RICH_TEXT = 'data.unknown_rich_text',
}

export enum Action {
  OPEN_APP = 'open-app',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ADD_BLACK_UP = 'add-black-up',
}

export function reportApiError(api: {
  url: string
  code: number
  message: string
}) {
  SentryExpo.Native.captureException('api:error', {
    tags: {
      type: ReportType.API,
      'type.category': Category.API_ERR,
    },
    contexts: {
      api,
    },
  })
}

export function reportNavigation(route: string) {
  SentryExpo.Native.captureMessage('user:action', {
    tags: {
      type: ReportType.USER_ACTION,
      'type.category': Category.NAVIGATION,
    },
    contexts: {
      route: {
        name: route,
      },
    },
  })
}

export function reportUserAction(action: Action, extraData: any = null) {
  SentryExpo.Native.captureMessage('user:action', {
    tags: {
      type: ReportType.USER_ACTION,
      'type.category': Category.COMMON_ACTION,
    },
    extra: {
      extraData,
    },
  })
  if (action === Action.LOGIN || action === Action.OPEN_APP) {
    getLocation().then(loc => {
      SentryExpo.Native.captureMessage('user:data', {
        tags: {
          type: ReportType.USER_DATA,
          'type.category': Category.LOCATION,
          location: [loc.country, loc.province, loc.city].join('/'),
        },
        contexts: {
          data: {
            location: loc,
          },
        },
      })
    })
  }
}

// export function reportUserLocation() {
//   getLocation().then(loc => {
//     SentryExpo.Native.captureMessage('user:data', {
//       tags: {
//         type: ReportType.USER_DATA,
//         'type.category': Category.LOCATION,
//       },
//       contexts: {
//         data: {
//           location: loc,
//         },
//       },
//     })
//   })
// }

export function setUser(mid: string | number, name: string) {
  SentryExpo.Native.setUser({ id: mid + '', username: name })
  SentryExpo.Native.setTag('biliUrl', `https://space.bilibili.com/${mid}`)
}

export function clearUser() {
  SentryExpo.Native.setUser(null)
  SentryExpo.Native.setTag('biliUrl', null)
}

export function reportUnknownDynamicItem(item: any) {
  let type = item.type
  if (type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    type = 'FORWARD:' + item.orig?.type
  }
  SentryExpo.Native.captureMessage('unknown dynamic item:' + type, {
    level: 'warning',
    tags: {
      type: ReportType.USER_DATA,
      'type.category': Category.UNKNOWN_ITEM,
    },
    extra: {
      dynamicItem: JSON.stringify(item, null, 2),
    },
  })
}

export function reportUnknownRichTextItem(item: any) {
  const type = item.type
  SentryExpo.Native.captureMessage('unknown rich text item:' + type, {
    level: 'warning',
    tags: {
      type: ReportType.USER_DATA,
      'type.category': Category.UNKNOWN_RICH_TEXT,
    },
    extra: {
      dynamicItem: JSON.stringify(item, null, 2),
    },
  })
}
