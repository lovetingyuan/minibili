import React from 'react'
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  Pressable,
  // ToastAndroid,
  Image,
  Linking,
  Alert,
} from 'react-native'
import { Avatar } from '@rneui/base'
import FollowItem from './FollowItem'
import { getFansData, getFollowUps, getUserInfo } from '../../services/Bilibili'
import TracyBtn from '../../components/TracyBtn'
import Login from './Login'

import { GetFuncPromiseType, RootStackParamList, UserInfo } from '../../types'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
// import useMemoizedFn from '../../hooks/useMemoizedFn'
import ButtonsOverlay from '../../components/ButtonsOverlay'
import * as Application from 'expo-application'
import useDialog from '../../hooks/useDialog'
import store from '../../valtio/store'
import { useSnapshot } from 'valtio'
// import { Badge } from '@rneui/base';
// import { LinearGradient } from 'expo-linear-gradient'

type Props = BottomTabScreenProps<RootStackParamList, 'Follow'>
type UpItem = GetFuncPromiseType<typeof getFollowUps>['list'][0]

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

const githubLink = 'https://github.com/lovetingyuan/minibili'

export default function Follow({ navigation, route }: Props) {
  __DEV__ && console.log(route.name)
  const { specialUser, userInfo, livingUps, updatedUps } = useSnapshot(store)
  const [ups, setUps] = React.useState<UpItem[]>([])
  // const [loadDone, setLoadDone] = React.useState(false)
  // const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [followedNum, setFollowedNum] = React.useState(0)
  // const [updateText, setUpdateText] = React.useState('刚刚更新');
  // const updateTimeRef = React.useRef(Date.now())
  const followListRef = React.useRef<FlatList | null>(null)
  // const [refresh] = React.useState(false)
  const currentList = React.useRef<any>(null)
  const [fans, setFans] = React.useState('')

  // React.useEffect(() => {
  //   setUps([...followedUps]);
  // }, [followedUps]);

  React.useEffect(() => {
    store.followedUps = [...ups]
  }, [ups])

  // const getUpdate = useMemoizedFn(() => {
  //   ToastAndroid.show('刷新中...', ToastAndroid.SHORT)
  //   setUps((currentList.current = []))
  //   setLoadDone(false)
  //   setLoading(false)
  //   setFollowedNum(0)
  //   setPage(1)
  // })
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
    setLoading(true)
    getFollowUps(userInfo.mid)
      .then(({ list, total }) => {
        setFollowedNum(total)
        setUps(list)
      })
      .catch(() => {
        setFollowedNum(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userInfo?.mid])
  // React.useEffect(() => {
  //   if (userInfo && (!currentList.current || currentList.current === ups)) {
  //     // fetc()
  //     updateTimeRef.current = Date.now()
  //     // setUpdateText('刚刚更新');
  //   }
  // }, [userInfo, currentList.current])

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return
      }
      ups.length &&
        followListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        })
    })
    return unsubscribe
  }, [navigation, ups])
  const [modalVisible, setModalVisible] = React.useState(false)

  const renderItem = ({ item }: { item: UpItem }) => {
    return <FollowItem item={item} />
  }
  // const loadMoreUps = () => {
  //   if (loadDone || loading || !userInfo) {
  //     return
  //   }
  //   setLoading(true)
  //   getFollowUps(userInfo.mid, page)
  //     .then(({ list, total }) => {
  //       if (!followedNum) {
  //         setFollowedNum(total)
  //       }
  //       if (list.length) {
  //         setUps(page === 1 ? list : ups.concat(list))
  //         setPage(page + 1)
  //       } else {
  //         setLoadDone(true)
  //       }
  //     })
  //     .catch(() => {
  //       setFollowedNum(0)
  //     })
  //     .finally(() => {
  //       setLoading(false)
  //     })
  // }

  const clearUser = async () => {
    setUps((currentList.current = []))
    // setLoadDone(false)
    setLoading(false)
    setFollowedNum(0)
    // setPage(1)
    store.userInfo = null
    store.updatedUps = {}
    store.specialUser = null
    store.dynamicUser = null
  }
  const version = Application.nativeApplicationVersion

  const dialogContent = (
    <>
      <Text style={{ fontSize: 16 }}>当前版本：{version}</Text>
      <Text>
        注：本应用所有数据均为B站官网公开，仅供学习交流
        <Text
          onPress={() => {
            Linking.openURL(githubLink)
          }}
          style={{ color: 'rgb(32, 137, 220)' }}>
          {' '}
          (github)
        </Text>
      </Text>
    </>
  )
  const { dialog, toggleDialog } = useDialog('关于minibili', dialogContent)

  const handleOverlayClick = (name: string) => {
    if (name === 'logout') {
      Alert.alert('确定退出吗？', '', [
        {
          text: '取消',
        },
        {
          text: '确定',
          onPress: clearUser,
        },
      ])
    } else if (name === 'about') {
      toggleDialog()
    }
  }

  if (!userInfo) {
    return <Login />
  }

  const topUps: UserInfo[] = []
  const updateUps: UserInfo[] = []
  if (specialUser) {
    topUps.push({ ...specialUser })
  }
  const notUpdateUsers: UserInfo[] = []
  for (let up of ups) {
    if (up.mid == specialUser?.mid) {
      continue
    }
    if (livingUps[up.mid]) {
      topUps.push(up)
    } else if (updatedUps[up.mid]) {
      updateUps.push(up)
    } else {
      notUpdateUsers.push(up)
    }
  }
  const displayUps = [...topUps, ...updateUps, ...notUpdateUsers]

  return (
    <View style={styles.container}>
      {dialog}
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
              {fans}关注
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
          onPress={handleOverlayClick}
          dismiss={() => {
            setModalVisible(false)
          }}
          overlayStyle={{
            minWidth: 240,
          }}
        />
      </View>
      <View style={styles.listTitleContainer}>
        <Text style={styles.listTitle}>
          关注列表
          <Text style={{ fontSize: 14 }}>({followedNum})</Text>：{' '}
        </Text>
      </View>
      <FlatList
        data={displayUps}
        renderItem={renderItem}
        keyExtractor={item => item.mid + ''}
        onEndReachedThreshold={1}
        // onEndReached={loadMoreUps}
        // refreshing={refresh}
        // onRefresh={getUpdate}
        ref={followListRef}
        ListEmptyComponent={
          <Text style={styles.listEmptyText}>
            {loading
              ? '加载中...'
              : ups.length
              ? ''
              : '暂无关注（需要在隐私设置中公开你的关注）'}
          </Text>
        }
        ListFooterComponent={
          <Text style={styles.bottomText}>
            {loading ? '加载中...' : '到底了~'}
          </Text>
        }
      />
      <TracyBtn />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  myName: { fontSize: 18, fontWeight: 'bold' },
  mySign: { color: '#555', marginTop: 6 },
  fansNumText: { fontSize: 14, fontWeight: 'normal' },
  logo: {
    width: 160,
    height: 160,
  },
  bottomText: {
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    color: '#555',
    fontSize: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  listTitleContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 16,
    marginTop: 18,
    marginBottom: 15,
  },
  userFace: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 20,
  },
  logoutText: { color: '#5896de', fontSize: 14 },
  listEmptyText: { textAlign: 'center', marginVertical: 40 },
  newIcon: { width: 28, height: 11, marginLeft: 8 },
  liveIcon: {
    width: 26,
    height: 24,
  },
  infoFace: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
  },
})
