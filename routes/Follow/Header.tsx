import React from 'react'
import { Text, View, Pressable, Image } from 'react-native'
import { Avatar } from '@rneui/base'

import ButtonsOverlay from '../../components/ButtonsOverlay'
import store from '../../store'
import { useSnapshot } from 'valtio'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { getFansData, getUserInfo } from '../../services/Bilibili'
import { Alert } from 'react-native'

const buttons = [
  {
    text: '退出',
    name: 'logout',
  },
  {
    text: '关于',
    name: 'about',
  },
]

export default function Header(props: {
  followedCount: number
  logOut: () => void
}) {
  const { userInfo } = useSnapshot(store)
  const navigation = useNavigation<NavigationProps['navigation']>()
  const [fans, setFans] = React.useState('')
  const [modalVisible, setModalVisible] = React.useState(false)

  React.useEffect(() => {
    if (!userInfo?.mid) {
      return
    }
    getUserInfo(userInfo.mid).then(user => {
      const info = {
        name: user.name,
        face: user.face,
        mid: user.mid + '',
        sign: user.sign,
      }
      store.userInfo = info
      if (!store.dynamicUser) {
        store.dynamicUser = { ...info }
      }
    })
    getFansData(userInfo.mid).then(data => {
      if (data.follower < 10000) {
        setFans(data.follower + '')
      } else {
        setFans((data.follower / 10000).toFixed(1) + '万')
      }
    })
  }, [userInfo?.mid])

  if (!userInfo) {
    return <View style={styles.userContainer} />
  }

  return (
    <View style={styles.userContainer}>
      <Avatar
        size={60}
        containerStyle={{ marginRight: 16 }}
        onPress={() => {
          if (userInfo) {
            store.dynamicUser = {
              ...userInfo,
            }
            navigation.navigate('Dynamic')
          }
        }}
        rounded
        source={
          userInfo.face
            ? { uri: userInfo.face }
            : require('../../assets/empty-avatar.png')
        }
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.myName}>
          {userInfo.name}
          <Text style={styles.fansNumText}>
            {'    '}
            {fans}粉丝
            {'    '}
            {props.followedCount}关注
          </Text>
        </Text>
        <Text style={styles.mySign}>{userInfo.sign}</Text>
      </View>
      <Pressable
        onPress={() => {
          setModalVisible(true)
        }}>
        <Image
          source={require('../../assets/snow.png')}
          style={styles.infoFace}
        />
      </Pressable>
      <ButtonsOverlay
        buttons={buttons}
        visible={modalVisible}
        onPress={(name: string) => {
          if (name === 'logout') {
            Alert.alert('确定退出吗？', '', [
              {
                text: '取消',
              },
              {
                text: '确定',
                onPress: () => {
                  props.logOut()
                },
              },
            ])
          } else if (name === 'about') {
            navigation.navigate('About')
          }
        }}
        dismiss={() => {
          setModalVisible(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  myName: { fontSize: 18, fontWeight: 'bold' },
  mySign: { color: '#555', marginTop: 6 },
  fansNumText: { fontSize: 14, fontWeight: 'normal' },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  infoFace: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
})