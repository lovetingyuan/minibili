import React from 'react'
import { Button, Card, Input, Text } from '@rneui/themed'
import {
  View,
  Image,
  Linking,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import store, { useStore } from '../../store'
import { useUserInfo } from '../../api/user-info'
import useMounted from '../../hooks/useMounted'
import { reportUserLogin } from '../../utils/report'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import { showToast } from '../../utils'

const leftTv = require('../../../assets/tv-left.png')
const rightTv = require('../../../assets/tv-right.png')

export default function Login() {
  const inputUserIdRef = React.useRef('')
  const [tvImg, setTvImg] = React.useState(true)
  const [userId, setUserId] = React.useState('')
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { $userInfo } = useStore()
  useMounted(() => {
    const timer = setInterval(() => {
      setTvImg(v => !v)
    }, 600)
    return () => {
      clearInterval(timer)
    }
  })
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
    if (error) {
      showToast('获取用户信息失败')
    }
  }, [error])

  const login = () => {
    if (!/^\d+$/.test(inputUserIdRef.current)) {
      showToast('请输入正确的UID')
      return
    }
    setUserId(inputUserIdRef.current)
    showToast('请稍候...')
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView>
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 50,
          }}>
          <View style={styles.logoContainer}>
            <View>
              <Card.Image
                source={tvImg ? leftTv : rightTv}
                style={styles.logo}
              />
              <Card.Title style={{ fontSize: 25 }}>MiniBili</Card.Title>
            </View>
            <Text style={styles.text}>
              你好，欢迎使用MiniBili，请访问你自己的B站主页（需登录）：
              <Text
                onPress={() => {
                  Linking.openURL('https://space.bilibili.com/')
                }}
                style={styles.linkText}
                selectable>
                {'\n'}https://space.bilibili.com/{'\n'}
              </Text>
              然后在浏览器地址栏查找并在下方输入你的B站ID(uid)
            </Text>
          </View>
          <Card.Divider />
          <Text
            style={{
              marginTop: 10,
              fontSize: 16,
              lineHeight: 25,
            }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              💡 帮助说明：
            </Text>
            B站ID为个人页面地址栏中的一串数字，如下图所示（ID为公开信息，请放心输入；另外
            <Text style={{ fontWeight: 'bold' }}>
              你需要在隐私设置中设置你的关注列表为公开
            </Text>
            ）
          </Text>
          <Button
            title={'视频帮助'}
            onPress={() => {
              navigation.navigate('Play', {
                bvid: 'BV1p54y1X7SH',
              })
            }}
          />
          <Image
            source={require('../../../assets/login-example.png')}
            resizeMode="contain"
            style={{
              width: '100%',
              // height: '28%',
            }}
          />
          <View style={styles.inputContainer}>
            <Input
              onChangeText={text => (inputUserIdRef.current = text)}
              placeholder="请输入你的B站ID"
              keyboardType="numeric"
              inputMode="numeric"
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 110,
    height: 110,
  },
  text: {
    fontSize: 18,
    flexShrink: 1,
    lineHeight: 30,
  },
  linkText: {
    margin: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(90, 154, 230, 1)',
  },
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
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
    width: '96%',
    marginVertical: 10,
  },
  buttonTextStyle: { fontWeight: '600', fontSize: 18 },
})
