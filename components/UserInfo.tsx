import { Avatar } from '@rneui/base';
import React from 'react';
import { Text, View } from 'react-native';
import WebView from 'react-native-webview';
import { getUserInfo } from '../services/Bilibili';

export default function UserInfo(props: { mid: string | number }) {
  const [userInfo, setUserInfo] = React.useState(null);
  const [showWebView, setShowWebView] = React.useState(false);
  React.useEffect(() => {
    getUserInfo(props.mid)
      .then(userInfo => {
        setUserInfo(userInfo);
      })
      .catch(err => {
        setShowWebView(true);
      });
  }, [props.mid]);
  if (!userInfo) {
    return (
      <View>
        加载中..
        {showWebView ? <WebView /> : null}.
      </View>
    );
  }
  return (
    <View>
      <Avatar />
      <View>
        <Text>{userInfo.name}</Text>
        <Text>{userInfo.sign}</Text>
      </View>
    </View>
  );
}
