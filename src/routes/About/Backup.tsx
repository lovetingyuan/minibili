import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Alert } from 'react-native'

import { useStore } from '@/store'

import { showToast } from '../../utils'
import TextAction from './TextAction'

export default React.memo(Backup)

function Backup() {
  const {
    get$blackUps,
    get$followedUps,
    get$blackTags,
    get$videoCatesList,
    get$collectedVideos,
    set$blackTags,
    set$followedUps,
    set$blackUps,
    set$videoCatesList,
    set$collectedVideos,
  } = useStore()

  return (
    <TextAction
      text="⚙️ 导入或导出当前设置"
      buttons={[
        {
          text: '导出数据',
          onPress: () => {
            const settings = JSON.stringify({
              type: 'minibili-settings',
              date: Date.now(),
              data: {
                $blackUps: get$blackUps(),
                $followedUps: get$followedUps(),
                $blackTags: get$blackTags(),
                $videoCatesList: get$videoCatesList(),
                $collectedVideos: get$collectedVideos(),
              },
            })
            Clipboard.setStringAsync(settings).then(() => {
              showToast('已复制当前设置，您可以粘贴到便签或备忘录中')
            })
          },
        },
        {
          text: '导入数据',
          onPress: () => {
            Clipboard.getStringAsync().then((res) => {
              try {
                const { type, data } = JSON.parse(res) as any
                if (type !== 'minibili-settings') {
                  throw new Error(res)
                }
                Alert.alert(
                  '导入粘贴板中的设置',
                  '确认要导入吗，会覆盖当前设置',
                  [
                    {
                      text: '取消',
                    },
                    {
                      text: '确定',
                      onPress: () => {
                        set$blackTags(data.$blackTags)
                        set$followedUps(data.$followedUps)
                        set$blackUps(data.$blackUps)
                        set$videoCatesList(data.$videoCatesList)
                        set$collectedVideos(data.$collectedVideos)
                        showToast('导入完成')
                      },
                    },
                  ],
                )
              } catch {
                showToast('导入失败，数据错误')
              }
            })
          },
        },
      ]}
    />
  )
}
