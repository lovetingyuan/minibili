import React from 'react'
import { Button, Input, Text } from '@rneui/themed'
import { View, Linking, StyleSheet, ScrollView, Keyboard } from 'react-native'
import store, { useStore } from '../../store'
import { useUserInfo } from '../../api/user-info'
import { reportUserLogin } from '../../utils/report'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import { showToast } from '../../utils'
import MyImage from '../../components/MyImage'
import commonStyles from '../../styles'

export default React.memo(function Login() {
  const inputUserIdRef = React.useRef('')
  const [userId, setUserId] = React.useState('')
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { $userInfo } = useStore()
  const scrollRef = React.useRef<ScrollView | null>(null)
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollRef.current?.scrollToEnd()
        }, 200)
      },
    )
    return () => {
      keyboardDidShowListener.remove()
    }
  }, [])
  const { data, error, isLoading } = useUserInfo(userId)
  if (userId && data?.mid && !$userInfo) {
    store.$userInfo = {
      name: data.name,
      mid: data.mid + '',
      face: data.face,
      sign: data.sign,
    }
    reportUserLogin(data.mid, data.name)
    setTimeout(() => {
      navigation.navigate('Follow')
    }, 100)
  }
  React.useEffect(() => {
    if (error && userId) {
      showToast('获取用户信息失败')
    }
  }, [error, userId])

  const login = () => {
    if (!/^\d+$/.test(inputUserIdRef.current)) {
      showToast('请输入正确的UID')
      return
    }
    setUserId(inputUserIdRef.current)
    showToast('请稍候...')
  }
  return (
    <ScrollView style={commonStyles.flex1} ref={scrollRef}>
      <View style={styles.topContainer}>
        <MyImage
          source={require('../../../assets/minibili.png')}
          style={styles.logo}
        />
        <Text h2 style={styles.logoText}>
          欢迎使用MiniBili
        </Text>
        <Text style={styles.helpText}>
          <Text style={[commonStyles.font16, commonStyles.bold]}>
            💡 请在下方输入你的B站ID：
          </Text>
          B站ID为个人页面地址栏中的一串数字，如下图所示（ID为公开信息，请放心输入；另外
          <Text style={commonStyles.bold}>
            你需要在隐私设置中设置你的关注列表为公开
          </Text>
          ）
          <Text
            style={commonStyles.link}
            onPress={() => {
              Linking.openURL('https://b23.tv/BV1p54y1X7SH')
            }}>
            查看视频帮助
          </Text>
        </Text>
        <MyImage
          source={require('../../../assets/login-example.png')}
          style={styles.helpImage}
          widthScale={0.85}
        />
      </View>
      <View style={styles.inputContainer}>
        <Input
          onChangeText={text => (inputUserIdRef.current = text)}
          placeholder="请输入你的B站ID"
          keyboardType="numeric"
          inputMode="numeric"
          onSubmitEditing={login}
          // enterKeyHint="enter"
        />
        <Button
          title="登 录"
          onPress={login}
          titleStyle={styles.buttonTextStyle}
          buttonStyle={styles.buttonStyle}
          containerStyle={styles.buttonContainerStyle}
          loading={isLoading}
        />
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  topContainer: {
    marginHorizontal: 20,
    marginTop: 50,
    alignItems: 'center',
  },
  logo: {
    marginTop: 30,
  },
  logoText: {
    marginVertical: 10,
    color: '#0083b1',
  },
  helpText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 25,
  },
  helpImage: { marginVertical: 20 },
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  buttonStyle: {
    backgroundColor: 'rgba(90, 154, 230, 1)',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 30,
    height: 45,
    marginBottom: 40,
  },
  buttonContainerStyle: {
    width: '95%',
    marginVertical: 10,
  },
  buttonTextStyle: { fontWeight: '600', fontSize: 18 },
})
