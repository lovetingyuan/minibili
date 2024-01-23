import React from 'react'
import { TouchableOpacity, Alert, View, Linking } from 'react-native'
import { Avatar, Badge, Text, useTheme } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps, UpInfo } from '../../types'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { useStore } from '../../store'
import { Image } from 'expo-image'
import { imgUrl, parseUrl } from '../../utils'

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
  const { theme } = useTheme()
  const buttons = [
    hasUpdate
      ? {
          text: '标记为已读',
          onPress: () => {
            const update = $upUpdateMap[mid]
            set$upUpdateMap({
              ...$upUpdateMap,
              [mid]: {
                latestId: update.currentLatestId,
                currentLatestId: update.currentLatestId,
              },
            })
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
                  latestId: Math.random().toString(),
                  currentLatestId: update.currentLatestId,
                },
              })
            } else {
              set$upUpdateMap({
                ...$upUpdateMap,
                [mid]: {
                  latestId: Math.random().toString(),
                  currentLatestId: Math.random().toString(),
                },
              })
              // showToast('请稍候再操作')
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
      }}
      className="items-center mb-4 flex-1 justify-between relative"
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
        {hasUpdate ? (
          <Badge
            key={mid}
            badgeStyle={tw(
              'h-4 w-4 rounded-[16px] absolute top-[-38px] left-[38px]',
              { backgroundColor: theme.colors.secondary },
            )}
          />
        ) : null}
      </View>
      {livingUps[mid] ? (
        <Text
          className="font-bold text-sm p-3 flex-1 text-center"
          style={{ color: theme.colors.primary }}
          onPress={gotoLivePage}>
          直播中~
        </Text>
      ) : (
        <Text
          className={`text-sm p-3 flex-1 text-center ${pin ? 'font-bold' : ''}`}
          style={
            hasUpdate
              ? {
                  color: theme.colors.secondary,
                }
              : null
          }
          numberOfLines={2}
          ellipsizeMode="tail">
          {name}
        </Text>
      )}
    </TouchableOpacity>
  )
})
