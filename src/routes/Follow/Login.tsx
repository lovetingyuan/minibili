import React from 'react'
import { Button, Input } from '@rneui/themed'
import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
  StyleSheet,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

import store from '../../store'
import { useUserInfo } from '../../api/user-info'
import useMounted from '../../hooks/useMounted'
import { useSnapshot } from 'valtio'
import {
  Action,
  reportUserAction,
  reportUserLocation,
  setUser,
} from '../../utils/report'

const leftTv = require('../../../assets/tv-left.png')
const rightTv = require('../../../assets/tv-right.png')

export default function Login() {
  const inputUserIdRef = React.useRef('')
  const [tvImg, setTvImg] = React.useState(true)
  const [userId, setUserId] = React.useState('')
  const { $userInfo } = useSnapshot(store)
  useMounted(() => {
    const timer = setInterval(() => {
      setTvImg(v => !v)
    }, 666)
    return () => {
      clearInterval(timer)
    }
  })
  const { data, error } = useUserInfo(userId)
  if (userId && data?.mid && !$userInfo) {
    store.$userInfo = {
      name: data.name,
      mid: data.mid + '',
      face: data.face,
      sign: data.sign,
    }
    setUser(data.mid, data.name)
    reportUserAction(Action.LOGIN, data)
    reportUserLocation()
  }
  React.useEffect(() => {
    if (error) {
      ToastAndroid.show('获取用户信息失', ToastAndroid.SHORT)
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
      style={{ padding: 30 }}>
      <View style={styles.logoContainer}>
        <Image source={tvImg ? leftTv : rightTv} style={styles.logo} />
      </View>
      <Text style={styles.text}>访问你的B站账号的主页并登录：</Text>
      <Pressable
        onPress={() => {
          Linking.openURL('https://space.bilibili.com/')
        }}>
        <Text style={styles.linkText} selectable>
          https://space.bilibili.com/
        </Text>
      </Pressable>
      <Text style={styles.text}>然后输入你的B站ID(uid)</Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
        说明：
      </Text>
      <Text style={{ paddingLeft: 20, marginTop: 5 }}>
        B站ID为个人页面地址栏中的一串数字（ID为公开信息，请放心输入）
      </Text>
      <Text style={{ paddingLeft: 20, marginTop: 5 }}>
        你需要在隐私设置中设置你的关注列表为公开
      </Text>
      <View style={styles.inputContainer}>
        <Input
          onChangeText={text => (inputUserIdRef.current = text)}
          placeholder="请输入你的B站ID"
          keyboardType="numeric"
        />
        <Button
          title="登 录"
          onPress={login}
          titleStyle={styles.buttonTextStyle}
          buttonStyle={styles.buttonStyle}
          containerStyle={styles.buttonContainerStyle}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 160,
    height: 160,
  },
  text: {
    fontSize: 16,
  },
  linkText: {
    margin: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(90, 154, 230, 1)',
  },
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 30,
    width: '95%',
  },
  buttonStyle: {
    backgroundColor: 'rgba(90, 154, 230, 1)',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 30,
    height: 45,
  },
  buttonContainerStyle: {
    width: '96%',
    marginVertical: 10,
  },
  buttonTextStyle: { fontWeight: '600', fontSize: 18 },
})
