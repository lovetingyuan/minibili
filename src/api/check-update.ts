import * as Application from 'expo-application'
import { Alert, Linking } from 'react-native'
import useSWR from 'swr'

// import useSWRMutation from 'swr/mutation'
import { GhProxy, githubLink } from '@/constants'
import { useStore } from '@/store'

const fetchVersion = () => {
  return fetch(
    'https://tingyuan.in/api/github/releases?user=lovetingyuan&repo=minibili&_t=' +
      Date.now(),
  )
    .then((r) => r.json())
    .then((r) => {
      if (r.code !== 0) {
        throw new Error(r.code + ':' + r.message)
      }
      return r.data as { version: string; changelog: string }[]
    })
}

export function useAppUpdateInfo() {
  const { set$checkAppUpdateTime } = useStore()
  const currentVersion = Application.nativeApplicationVersion!
  const {
    data: list,
    isValidating,
    error,
    mutate,
  } = useSWR('$check-app-update', fetchVersion)

  const latest = list?.[0]
  const latestVersion = latest?.version.split('-')[1]
  const changelog = latest?.changelog
  const downloadLink = latestVersion
    ? `${GhProxy}/${githubLink}/releases/download/v${latestVersion}/${latest.version}.apk`
    : undefined
  const showAlert = () => {
    set$checkAppUpdateTime(Date.now())
    Alert.alert(
      '🎉 有新版本',
      [`${currentVersion}  ⟶  ${latestVersion}`, '', changelog].join('\n'),
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '下载新版',
          isPreferred: true,
          onPress: () => {
            if (downloadLink) {
              Linking.openURL(downloadLink)
            }
          },
        },
      ],
    )
  }
  return {
    currentVersion,
    hasUpdate: latestVersion ? latestVersion !== currentVersion : false,
    downloadLink,
    latestVersion,
    changelog,
    changeList: list,
    loading: isValidating,
    error,
    showAlert,
    checkUpdate: mutate,
  }
}

// export function useGetAppUpdateInfo() {
//   // const { set$checkAppUpdateTime } = useStore()
//   const currentVersion = Application.nativeApplicationVersion!
//   const {
//     data: list,
//     trigger,
//     error,
//     isMutating,
//   } = useSWRMutation('$check-app-update', fetchVersion)

//   const latest = list?.[0]
//   const latestVersion = latest?.version.split('-')[1]

//   return {
//     currentVersion,
//     hasUpdate: latestVersion ? latestVersion !== currentVersion : false,
//     downloadLink: latestVersion
//       ? `${GhProxy}/${githubLink}/releases/download/v${latestVersion}/${latest.version}.apk`
//       : undefined,
//     latestVersion,
//     changelog: latest?.changelog,
//     changeList: list,
//     loading: isMutating,
//     error,
//     checkUpdate: trigger,
//   }
// }
