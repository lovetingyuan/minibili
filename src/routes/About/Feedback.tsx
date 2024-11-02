import { BottomSheet, Button, Card, Dialog, Input, Text } from '@rneui/themed'
import { UserFeedback } from '@sentry/react-native'
import * as Sentry from '@sentry/react-native'
import React from 'react'
import { Linking, View } from 'react-native'

import Modal2 from '@/components/Modal2'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'

import { githubLink } from '../../constants'
import { showToast } from '../../utils'
// import { reportUserFeedback } from '../../utils/report'
import TextAction from './TextAction'

export default React.memo(Feedback)

function Feedback() {
  const [feedBackVisible, setFeedbackVisible] = React.useState(false)
  const { get$showUsageStatement, set$showUsageStatement } = useStore()
  const [showStatement, setShowStatement] = React.useState(
    get$showUsageStatement(),
  )
  const hideFeedback = () => {
    setFeedbackVisible(false)
  }
  const showFeedback = () => {
    setFeedbackVisible(true)
  }

  const feedbackRef = React.useRef('')
  const feedbackContactRef = React.useRef('')
  const submitFeedback = () => {
    const message = feedbackRef.current.trim()
    if (message.length === 0) {
      hideFeedback()
      return
    }
    const sentryId = Sentry.captureMessage('user feedback')

    const userFeedback: UserFeedback = {
      event_id: sentryId,
      name: feedbackContactRef.current,
      email: feedbackContactRef.current || 'N/A',
      comments: message,
    }
    Sentry.captureUserFeedback(userFeedback)
    // reportUserFeedback(message, feedbackContactRef.current)
    hideFeedback()
    showToast('感谢反馈 😊')
  }
  return (
    <TextAction
      text="💗 欢迎使用本应用"
      buttons={[
        {
          text: '使用声明',
          onPress: () => {
            setShowStatement(true)
          },
        },
        {
          text: '使用反馈',
          onPress: showFeedback,
        },
      ]}>
      <Dialog
        isVisible={feedBackVisible}
        onBackdropPress={hideFeedback}
        ModalComponent={Modal2}
        overlayStyle={tw(colors.gray2.bg)}>
        <Dialog.Title
          title="欢迎反馈意见 😊"
          titleStyle={tw(colors.black.text)}
        />
        <View>
          <Input
            placeholder="填写意见"
            multiline
            autoFocus
            className="mt-5 h-20"
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColor={tw(colors.gray4.text).color}
            onChangeText={(value) => (feedbackRef.current = value)}
          />
          <Input
            placeholder="联系方式"
            maxLength={100}
            placeholderTextColor={tw(colors.gray4.text).color}
            onChangeText={(value) => (feedbackContactRef.current = value)}
          />
        </View>
        <Dialog.Actions>
          <Dialog.Button title="提交" onPress={submitFeedback} />
          <Dialog.Button title="取消" onPress={hideFeedback} />
        </Dialog.Actions>
      </Dialog>
      <BottomSheet
        onBackdropPress={() => {
          setShowStatement(false)
        }}
        backdropStyle={tw('opacity-80 bg-gray-800')}
        modalProps={{
          onRequestClose: () => {
            setShowStatement(false)
          },
          statusBarTranslucent: true,
        }}
        isVisible={showStatement}>
        <Card containerStyle={tw('m-0')}>
          <Card.Title h4 className="text-left">
            📣使用声明
          </Card.Title>
          <Card.Divider />
          <View>
            <Text className="text-base">感谢你使用这款应用(MiniBili) ❤</Text>
            <Text />
            <Text className="text-base">
              本应用完全开源并且所有数据均为B站官网公开，不涉及任何个人隐私数据，
              <Text className="font-bold">*仅供*</Text>
              个人使用及学习交流!
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
            <Text className="text-base">⚠️ 切勿频繁刷新数据！🙏</Text>
            <View className="my-3 items-end">
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
    </TextAction>
  )
}
