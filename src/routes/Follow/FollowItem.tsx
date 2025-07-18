import { useNavigation } from '@react-navigation/native'
import { Avatar, Badge, Text } from '@rn-vui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, Linking, Pressable, TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import useMemoizedFn from '../../hooks/useMemoizedFn'
import { useStore } from '../../store'
import type { NavigationProps, UpInfo } from '../../types'
import { parseImgUrl, parseUrl } from '../../utils'

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
    setCheckLiveTimeStamp,
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
      setCheckLiveTimeStamp(Date.now())
      navigation.navigate('Living', {
        url: liveUrl,
        title: `${name}的直播间`,
      })
    }
  })
  const buttons = () =>
    [
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
                    (u) => u.mid.toString() !== mid.toString(),
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
                (u) => u.mid.toString() === mid.toString(),
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
            (u) => u.mid.toString() === mid.toString(),
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
    ].filter((v) => !!v && typeof v === 'object')

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onLongPress={() => {
        setOverlayButtons(buttons())
      }}
      className="mx-1 mb-6 flex-1 items-center"
      onPress={gotoDynamic}>
      <View className="relative">
        <Avatar
          size={48}
          ImageComponent={Image}
          rounded
          source={{
            uri: parseImgUrl(face, 120),
          }}
        />
        {livingUps[mid] ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              gotoLivePage()
            }}
            className="absolute inset-0 h-12 w-12 items-center justify-center rounded-full bg-neutral-950/60">
            <Text className={'text-center font-bold text-teal-300'}>
              直播中
            </Text>
          </Pressable>
        ) : null}
        {hasUpdate ? (
          <Badge
            key={mid}
            badgeStyle={tw(
              `h-4 w-4 rounded-full absolute top-[-45px] left-[38px] ${colors.secondary.bg}`,
            )}
          />
        ) : null}
      </View>
      <Text
        className={`flex-1 shrink-0 py-2 text-center text-sm ${
          pin ? `font-bold ${colors.primary.text}` : ''
        } ${hasUpdate ? colors.secondary.text : ''}`}
        numberOfLines={2}
        ellipsizeMode="tail">
        {name}
      </Text>
    </TouchableOpacity>
  )
}
