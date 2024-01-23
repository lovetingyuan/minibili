import React from 'react'
import { View, Share } from 'react-native'
import { Dialog, Input, useTheme } from '@rneui/themed'
import { reportUserFeedback } from '../../utils/report'
import { showToast } from '../../utils'
import { site } from '../../constants'
import TextAction from './TextAction'

export default React.memo(function Feedback() {
  const [feedBackVisible, setFeedbackVisible] = React.useState(false)
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
    reportUserFeedback(message, feedbackContactRef.current)
    hideFeedback()
    showToast('感谢反馈 😊')
  }
  const { theme } = useTheme()
  return (
    <TextAction
      text="欢迎分享本应用 ❤"
      buttons={[
        {
          text: '分享',
          onPress: () => {
            Share.share({
              message: 'MiniBili - 简单的B站浏览\n点击下载：' + site,
            })
          },
        },
        {
          text: '使用反馈',
          onPress: showFeedback,
        },
      ]}>
      <Dialog isVisible={feedBackVisible} onBackdropPress={hideFeedback}>
        <Dialog.Title
          title="欢迎反馈意见 😊"
          titleStyle={{ color: theme.colors.black }}
        />
        <View>
          <Input
            placeholder="填写意见"
            multiline
            autoFocus
            className="mt-5 h-20"
            maxLength={500}
            textAlignVertical="top"
            placeholderTextColor={theme.colors.grey3}
            onChangeText={value => (feedbackRef.current = value)}
          />
          <Input
            placeholder="联系方式"
            maxLength={100}
            placeholderTextColor={theme.colors.grey3}
            onChangeText={value => (feedbackContactRef.current = value)}
          />
        </View>
        <Dialog.Actions>
          <Dialog.Button title="提交" onPress={submitFeedback} />
          <Dialog.Button title="取消" onPress={hideFeedback} />
        </Dialog.Actions>
      </Dialog>
    </TextAction>
  )
})
