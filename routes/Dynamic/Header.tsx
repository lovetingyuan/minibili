import React from 'react'
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native'
import { Avatar } from '@rneui/base'
import { getFansData, getUserInfo } from '../../services/Bilibili'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList, UserInfo } from '../../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button } from '@rneui/base'
import { handleShareUp } from '../../services/Share'
import { MaterialCommunityIcons } from '@expo/vector-icons'
type NavigationProps = NativeStackScreenProps<RootStackParamList>

export default function Header(props: UserInfo) {
  const { mid } = props
  const [fans, setFans] = React.useState('')

  const navigation = useNavigation<NavigationProps['navigation']>()
  const [userInfo, setUserInfo] = React.useState<UserInfo>({ ...props })
  const [liveInfo, setLiveInfo] = React.useState({
    living: false,
    liveUrl: '',
  })
  React.useEffect(() => {
    if (!mid) {
      return
    }
    getUserInfo(mid).then(res => {
      setUserInfo({
        name: res.name,
        face: res.face,
        sign: res.sign,
        mid: res.mid + '',
      })
      setLiveInfo({
        living: res.living,
        liveUrl: res.liveUrl || '',
      })
    })
    getFansData(mid).then(data => {
      if (data.follower < 10000) {
        setFans(data.follower + '')
      } else {
        setFans((data.follower / 10000).toFixed(1) + '万')
      }
    })
  }, [mid])
  const avatar = userInfo.face
  if (!mid) {
    return <Text>{userInfo.name}</Text>
  }
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
            {'   '} {fans}粉丝
          </Text>
          <Pressable
            style={{ marginLeft: 10 }}
            onPress={() => {
              if (userInfo) {
                handleShareUp(userInfo.name, userInfo.mid, userInfo.sign)
              }
            }}>
            <MaterialCommunityIcons name="share" size={22} color="#666" />
          </Pressable>
        </View>

        <Text style={styles.sign} numberOfLines={2}>
          {userInfo.sign}
        </Text>
      </View>
      {liveInfo.living ? (
        <Button
          title="直播中"
          type="clear"
          titleStyle={{ fontSize: 13 }}
          onPress={() => {
            if (liveInfo.liveUrl) {
              navigation.navigate('WebPage', {
                url: liveInfo.liveUrl,
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