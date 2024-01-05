import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  View,
  Linking,
} from 'react-native'
import { Avatar, Badge, Text } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps, UpInfo } from '../../types'
// import { Button } from '@rneui/themed'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { useStore } from '../../store'
import { Image } from 'expo-image'
import { imgUrl, parseUrl, showToast } from '../../utils'
// import commonStyles from '../../styles'

export default React.memo(function FollowItem(props: {
  item: UpInfo
  index?: number
}) {
  // __DEV__ && console.log('follow item', props.item.name)
  const {
    item: { face, name, sign, mid, pin },
    index,
  } = props
  const {
    $upUpdateMap,
    set$upUpdateMap,
    livingUps,
    setOverlayButtons,
    set$followedUps,
    get$followedUps,
  } = useStore()
  let hasUpdate = false
  if ($upUpdateMap[mid]) {
    const { latestId, currentLatestId } = $upUpdateMap[mid]
    hasUpdate = latestId !== currentLatestId
  }
  const navigation = useNavigation<NavigationProps['navigation']>()
  const gotoDynamic = useMemoizedFn(() => {
    navigation.navigate('Dynamic', {
      user: {
        mid,
        face,
        name,
        sign,
      },
    })
  })
  const gotoLivePage = useMemoizedFn(() => {
    const liveUrl = livingUps[mid]
    if (liveUrl) {
      navigation.navigate('WebPage', {
        url: liveUrl,
        title: name + '的直播间',
      })
    }
  })
  const buttons = [
    hasUpdate
      ? {
          text: '标记为已读',
          onPress: () => {
            const update = $upUpdateMap[mid]
            set$upUpdateMap({
              ...$upUpdateMap,
              [mid]: {
                latestId: update.latestId,
                currentLatestId: update.latestId,
              },
            })
            // store.$upUpdateMap[mid].latestId =
            //   store.$upUpdateMap[mid].currentLatestId
          },
        }
      : {
          text: '标记为未读',
          onPress: () => {
            if (mid in $upUpdateMap) {
              const update = $upUpdateMap[mid]
              set$upUpdateMap({
                ...$upUpdateMap,
                [mid]: {
                  latestId: update.latestId,
                  currentLatestId: Math.random().toString(),
                },
              })
              // store.$upUpdateMap[mid].latestId = Math.random().toString()
            } else {
              showToast('请稍候再操作')
            }
          },
        },
    {
      text: '取消关注',
      onPress: () => {
        Alert.alert('确定取消关注吗？', '', [
          { text: '关闭' },
          {
            text: '确定',
            onPress() {
              set$followedUps(get$followedUps().filter(u => u.mid != mid))
              // store.$followedUps = store.$followedUps.filter(
              //   up => up.mid != mid,
              // )
            },
          },
        ])
      },
    },
    {
      text: '查看头像',
      onPress: () => {
        Linking.openURL(parseUrl(face))
      },
    },
    pin && index === 0
      ? null
      : {
          text: '置顶UP',
          onPress: () => {
            const followedUps = get$followedUps()
            const index = followedUps.findIndex(u => u.mid == mid)
            followedUps[index] = {
              ...followedUps[index],
              pin: Date.now(),
            }
            set$followedUps(followedUps.slice())
            // store.$followedUps[index] = {
            //   ...store.$followedUps[index],
            //   pin: Date.now(),
            // }
          },
        },
    pin && {
      text: '取消置顶',
      onPress: () => {
        const followedUps = get$followedUps()
        const index = followedUps.findIndex(u => u.mid == mid)
        followedUps[index] = {
          ...followedUps[index],
          pin: 0,
        }
        set$followedUps(followedUps.slice())
      },
    },
    __DEV__ && {
      text: `${$upUpdateMap[mid]?.latestId} - ${$upUpdateMap[mid]?.currentLatestId}`,
      onPress: () => {},
    },
  ].filter(Boolean)

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onLongPress={() => {
        setOverlayButtons(buttons)
        // store.overlayButtons = buttons
      }}
      style={styles.container}
      onPress={gotoDynamic}>
      <View>
        <Avatar
          size={46}
          ImageComponent={Image}
          rounded
          source={{
            uri: imgUrl(face, 120),
          }}
        />
        {hasUpdate ? <Badge key={mid} badgeStyle={styles.updateMark} /> : null}
      </View>
      {livingUps[mid] ? (
        <Text style={[styles.name, styles.liveText]} onPress={gotoLivePage}>
          直播中~
        </Text>
      ) : (
        <Text
          style={[
            styles.name,
            hasUpdate
              ? {
                  color: '#E84B85',
                }
              : null,
            pin
              ? {
                  fontWeight: 'bold',
                }
              : null,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail">
          {name}
        </Text>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 15,
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
  },
  name: {
    fontSize: 14,
    padding: 10,
    textAlign: 'center',
    flex: 1,
  },
  updateMark: {
    height: 14,
    width: 14,
    backgroundColor: '#fb7299',
    borderRadius: 14,
    position: 'absolute',
    top: -38,
    left: 38,
    // top: -40,
    // right: -30,
  },
  // livingBtn: {
  //   // borderWidth: 1,
  //   top: -5,
  //   // position: 'relative',
  //   // marginTop: 8,
  // },
  liveText: {
    color: '#008AC5',
    fontWeight: 'bold',
  },
})
