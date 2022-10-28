import React from 'react';
import { Input, Button, Icon } from '@rneui/base';
import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import { getUserInfo } from '../../services/Bilibili';
import store from '../../valtio/store';

const leftTv = require('../../assets/tv-left.png');
const rightTv = require('../../assets/tv-right.png');

export default function Login() {
  const inputUserIdRef = React.useRef('');
  const inputRef = React.useRef(null);
  const [tvImg, setTvImg] = React.useState(true);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTvImg(v => !v);
    }, 666);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const storeUserId = () => {
    if (!inputUserIdRef.current) {
      ToastAndroid.show('请输入ID', ToastAndroid.SHORT);
      return;
    }
    getUserInfo(inputUserIdRef.current)
      .then(user => {
        if (!user?.mid) {
          ToastAndroid.show('获取用户信息失败', ToastAndroid.SHORT);
          return;
        }
        store.userInfo = {
          name: user.name,
          mid: user.mid + '',
          face: user.face,
          sign: user.sign,
        };
      })
      .catch(() => {
        ToastAndroid.show('获取用户信息失败', ToastAndroid.SHORT);
        store.userInfo = {
          name: '',
          face: '',
          mid: '',
          sign: '',
        };
      });
  };
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={tvImg ? leftTv : rightTv} style={styles.logo} />
      </View>
      <Text style={styles.text}>访问你的B站账号的主页并登录：</Text>
      <Pressable
        onPress={() => {
          Linking.openURL('https://space.bilibili.com/');
        }}>
        <Text style={styles.linkText} selectable>
          https://space.bilibili.com/
        </Text>
      </Pressable>
      <Text style={styles.text}>
        然后输入你的B站ID（注意：你需要在隐私设置中设置你的关注列表为公开）
      </Text>
      <Text style={styles.text}>
        说明：B站ID为个人页面地址栏中的一串数字（ID为公开信息，请放心输入）
      </Text>
      <View style={styles.inputContainer}>
        <Input
          placeholder="请输入你的B站ID"
          onChangeText={text => (inputUserIdRef.current = text)}
          leftIcon={<Icon name="account-box" size={20} />}
          keyboardType="numeric"
          ref={inputRef}
          onSubmitEditing={storeUserId}
          style={{ flex: 1 }}
        />
        <Button
          title="登 录"
          onPress={storeUserId}
          titleStyle={styles.buttonTextStyle}
          buttonStyle={styles.buttonStyle}
          containerStyle={styles.buttonContainerStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: '12%',
  },
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
});
