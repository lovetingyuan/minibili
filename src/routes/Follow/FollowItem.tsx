import { useNavigation } from '@react-navigation/native'
import { Avatar, Badge, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, Linking, TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import useMemoizedFn from '../../hooks/useMemoizedFn'
import { useStore } from '../../store'
import type { NavigationProps, UpInfo } from '../../types'
import { imgUrl, parseUrl } from '../../utils'

export default React.memo(FollowItem)

function FollowItem(props: { item: UpInfo; index?: number }) {
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
        Alert.alert(`确定取消关注「${name}」吗？`, '', [
          { text: '关闭' },
          {
            text: '确定',
            onPress() {
              set$followedUps(
                get$followedUps().filter(
                  u => u.mid.toString() !== mid.toString(),
                ),
              )
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
            const i = followedUps.findIndex(
              u => u.mid.toString() === mid.toString(),
            )
            followedUps[i] = {
              ...followedUps[i],
              pin: Date.now(),
            }
            set$followedUps(followedUps.slice())
          },
        },
    pin && {
      text: '取消置顶',
      onPress: () => {
        const followedUps = get$followedUps()
        const i = followedUps.findIndex(
          u => u.mid.toString() === mid.toString(),
        )
        followedUps[i] = {
          ...followedUps[i],
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
      className="items-center mb-6 flex-1 justify-between relative"
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
              `h-4 w-4 rounded-[16px] absolute top-[-40px] left-[38px] ${colors.secondary.bg}`,
            )}
          />
        ) : null}
      </View>
      {livingUps[mid] ? (
        <Text
          className={`font-bold shrink-0 text-sm py-2 flex-1 text-center ${colors.success.text}`}
          onPress={gotoLivePage}>
          直播中~
        </Text>
      ) : (
        <Text
          className={`text-sm py-2 shrink-0 flex-1 text-center ${
            pin ? `font-bold ${colors.primary.text}` : ''
          } ${hasUpdate ? colors.secondary.text : ''}`}
          numberOfLines={2}
          ellipsizeMode="tail">
          {name}
        </Text>
      )}
    </TouchableOpacity>
  )
}
