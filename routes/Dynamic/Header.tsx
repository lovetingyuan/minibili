import React from 'react'
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native'
import { Avatar, Icon } from '@rneui/base'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList, UserInfo } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button } from '@rneui/base'
import { handleShareUp } from '../../services/Share'
import { useUserInfo } from '../../services/api/user-info'

type NavigationProps = NativeStackScreenProps<RootStackParamList>

export default function Header(props: UserInfo) {
  const { mid } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  const userInfo = { ...props }
  const livingInfo = {
    living: false,
    liveUrl: '',
  }
  const { data } = useUserInfo(props.mid)
  if (data?.mid) {
    Object.assign(userInfo, {
      name: data.name,
      face: data.face,
      sign: data.sign,
      mid: data.mid + '',
    })
    Object.assign(livingInfo, {
      living: data.living,
      liveUrl: data.liveUrl || '',
    })
  }
  const fansCount = data?.fans

  const avatar = userInfo.face

  return (
    <View style={styles.header}>
      <TouchableWithoutFeedback
        onPress={() => {
          navigation.navigate('WebPage', {
            url: `https://space.bilibili.com/${mid}`,
            title: userInfo.name + '的主页',
          })
        }}>
        <Avatar
          size={58}
          containerStyle={{ marginRight: 14 }}
          rounded
          source={
            avatar
              ? { uri: avatar + '@240w_240h_1c.webp' }
              : require('../../assets/empty-avatar.png')
          }
        />
      </TouchableWithoutFeedback>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ ...styles.name }}>{userInfo.name}</Text>
          <Text>
            {'   '} {fansCount}粉丝
          </Text>
          <Pressable
            style={{ marginLeft: 10 }}
            onPress={() => {
              if (userInfo) {
                handleShareUp(userInfo.name, userInfo.mid, userInfo.sign)
              }
            }}>
            <Icon type="fontisto" name="share-a" size={13} color="#666" />
          </Pressable>
        </View>

        <Text style={styles.sign} numberOfLines={2}>
          {userInfo.sign}
        </Text>
      </View>
      {livingInfo.living ? (
        <Button
          title="直播中"
          type="clear"
          titleStyle={{ fontSize: 13 }}
          onPress={() => {
            if (livingInfo.liveUrl) {
              navigation.navigate('WebPage', {
                url: livingInfo.liveUrl,
                title: userInfo.name + '的直播间',
              })
            }
          }}
        />
      ) : null}
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: 50,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 20,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 18,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sign: {
    marginTop: 3,
    fontStyle: 'italic',
    fontSize: 13,
    letterSpacing: 1,
    color: '#666',
  },
  livingText: {
    color: '#86b300',
    marginLeft: 20,
  },
  shareImg: { width: 15, height: 15, marginLeft: 20 },
})
