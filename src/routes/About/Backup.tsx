import React from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button, Text } from '@rneui/themed'
import { showToast } from '../../utils'
import { useStore } from '../../store'
import * as Clipboard from 'expo-clipboard'

export default React.memo(function Backup() {
  const {
    get$blackUps,
    get$followedUps,
    get$blackTags,
    get$videoCatesList,
    set$blackTags,
    set$followedUps,
    set$blackUps,
    set$videoCatesList,
  } = useStore()

  return (
    <View style={styles.infoItem}>
      <Text style={styles.title}>导出或导入当前设置</Text>
      <View style={styles.btns}>
        <Button
          type="clear"
          size="sm"
          onPress={() => {
            const settings = JSON.stringify({
              type: 'minibili-settings',
              data: {
                $blackUps: get$blackUps(),
                $followedUps: get$followedUps(),
                $blackTags: get$blackTags(),
                $videoCatesList: get$videoCatesList(),
              },
            })
            Clipboard.setStringAsync(settings).then(() => {
              showToast('已复制当前设置，您可以粘贴到便签或备忘录中')
            })
          }}>
          导出
        </Button>
        <Button
          type="clear"
          size="sm"
          onPress={() => {
            Clipboard.getStringAsync().then(res => {
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
                        showToast('导入完成')
                      },
                    },
                  ],
                )
              } catch (e) {
                showToast('导入失败，数据错误')
              }
            })
          }}>
          导入
        </Button>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  title: { fontSize: 16 },
  btns: { flexDirection: 'row' },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
})
