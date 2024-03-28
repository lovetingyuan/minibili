import { BottomSheet, Button, Card, Text } from '@rneui/themed'
import React from 'react'
import { Linking, View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'

import { githubLink } from '../../constants'
import TextAction from './TextAction'

export default React.memo(Statement)

function Statement() {
  const { get$showUsageStatement, set$showUsageStatement } = useStore()
  const [showStatement, setShowStatement] = React.useState(
    get$showUsageStatement(),
  )
  return (
    <>
      <TextAction
        text="📣 使用声明"
        buttons={[
          {
            text: '查看',
            onPress: () => {
              setShowStatement(true)
            },
          },
        ]}
      />
      <BottomSheet
        onBackdropPress={() => {
          setShowStatement(false)
        }}
        modalProps={{
          onRequestClose: () => {
            setShowStatement(false)
          },
        }}
        isVisible={showStatement}>
        <Card containerStyle={tw('m-0')}>
          <Card.Title h4 className="text-left">
            使用声明
          </Card.Title>
          <Card.Divider />
          <View>
            <Text className="text-base">感谢你使用这款应用 ❤</Text>
            <Text />
            <Text className="text-base">
              本应用完全开源并且所有数据均为B站官网公开，不涉及任何个人隐私数据，仅供学习交流!
            </Text>
            <Text className="text-base">
              有问题欢迎使用意见反馈或者在
              <Text
                className={colors.primary.text}
                onPress={() => {
                  Linking.openURL(githubLink)
                }}>
                {' Github '}
              </Text>
              中提出 😀
            </Text>
            <Text />
            <Text>⚠️ 切勿频繁刷新数据！🙏</Text>
            <View className="items-end my-3">
              <Button
                size="sm"
                onPress={() => {
                  set$showUsageStatement(false)
                  setShowStatement(false)
                }}>
                {' 我已知晓 '}
              </Button>
            </View>
          </View>
        </Card>
      </BottomSheet>
    </>
  )
}
