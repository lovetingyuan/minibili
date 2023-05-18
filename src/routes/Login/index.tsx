import React from 'react'
import { Button, Card, Input } from '@rneui/themed'
import {
  View,
  Text,
  Image,
  Linking,
  StyleSheet,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'

import store, { useStore } from '../../store'
import { useUserInfo } from '../../api/user-info'
import useMounted from '../../hooks/useMounted'

import { Action, reportUserAction, setUser } from '../../utils/report'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

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
    setUser(data.mid, data.name)
    reportUserAction(Action.LOGIN, data)
    navigation.navigate('Follow')
  }
  React.useEffect(() => {
    if (error) {
      ToastAndroid.show('获取用户信息失败', ToastAndroid.SHORT)
    }
  }, [error])

  const login = () => {
    if (!inputUserIdRef.current) {
      ToastAndroid.show('请输入ID', ToastAndroid.SHORT)
      return
    }
    if (!/^\d{3,}$/.test(inputUserIdRef.current)) {
      ToastAndroid.show('请输入正确的UID', ToastAndroid.SHORT)
      return
    }
    setUserId(inputUserIdRef.current)
    ToastAndroid.show('请稍候...', ToastAndroid.SHORT)
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView style={{ backgroundColor: '#ededed' }}>
        <Card
          containerStyle={{
            marginHorizontal: 10,
            marginTop: 50,
          }}>
          <View style={styles.logoContainer}>
            <Card.Image source={tvImg ? leftTv : rightTv} style={styles.logo} />
          </View>
          <Card.Title style={{ fontSize: 30 }}>MiniBili</Card.Title>
          <Card.Divider />
          <Text style={styles.text}>访问你的B站账号的主页并登录：</Text>
          <Text
            onPress={() => {
              Linking.openURL('https://space.bilibili.com/')
            }}
            style={styles.linkText}
            selectable>
            https://space.bilibili.com/
          </Text>
          <Text style={styles.text}>然后输入你的B站ID(uid)</Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 16,
              lineHeight: 25,
            }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>说明：</Text>
            B站ID为个人页面地址栏中的一串数字，如下图所示（ID为公开信息，请放心输入；另外
            <Text style={{ fontWeight: 'bold' }}>
              你需要在隐私设置中设置你的关注列表为公开
            </Text>
            ）
          </Text>
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
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
  },
  text: {
    fontSize: 18,
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
    marginTop: 20,
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
