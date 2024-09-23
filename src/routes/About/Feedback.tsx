import { Dialog, Input } from '@rneui/themed'
import React from 'react'
import { Share, View } from 'react-native'

import Modal2 from '@/components/Modal2'
import { colors } from '@/constants/colors.tw'

import { site } from '../../constants'
import { showToast } from '../../utils'
import { reportUserFeedback } from '../../utils/report'
import TextAction from './TextAction'

export default React.memo(Feedback)

function Feedback() {
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
  return (
    <TextAction
      text="💗 欢迎分享本应用"
      buttons={[
        {
          text: '分享',
          onPress: () => {
            Share.share({
              message: `MiniBili - 简单的B站浏览\n点击下载：${site}`,
            })
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
    </TextAction>
  )
}
