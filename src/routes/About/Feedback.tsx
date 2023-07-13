import React from 'react'
import { View, Share, StyleSheet } from 'react-native'
import { Button, Dialog, Input, Text, useTheme } from '@rneui/themed'
import { reportUserFeedback } from '../../utils/report'
import { showToast } from '../../utils'
// import { useStore } from '../../store'
import { site } from '../../constants'

export default React.memo(function Feedback() {
  // const { $userInfo } = useStore()
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
    <View style={styles.infoItem}>
      <Text style={styles.title}>欢迎分享本应用 ❤</Text>
      <View style={styles.btns}>
        <Button
          type="clear"
          size="sm"
          onPress={() => {
            Share.share({
              message: 'MiniBili - 简单的B站浏览\n点击下载：' + site,
            })
          }}>
          分享
        </Button>
        <Button type="clear" size="sm" onPress={showFeedback}>
          意见反馈
        </Button>
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
              style={styles.adviceInput}
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
  adviceInput: { marginTop: 20, height: 80 },
})
