import * as SentryExpo from 'sentry-expo'
import getLocation from '../api/get-location'

export enum ReportType {
  USER_ACTION = 'user_action',
  USER_DATA = 'user_data',
  API = 'api',
}

export enum Category {
  API_ERR = 'api.error',
  NAVIGATION = 'action.navigation',
  LOGIN = 'action.login',
  LOCATION = 'data.location',
  COMMON_ACTION = 'action.common',
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
    contexts: {
      action: {
        name: action,
        payload: extraData,
      },
    },
  })
  if (action === Action.LOGIN || action === Action.OPEN_APP) {
    getLocation().then(loc => {
      SentryExpo.Native.captureMessage('user:data', {
        tags: {
          type: ReportType.USER_DATA,
          'type.category': Category.LOCATION,
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
}

export function clearUser() {
  SentryExpo.Native.setUser(null)
}
