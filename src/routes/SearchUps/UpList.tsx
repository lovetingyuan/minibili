import { useNavigation } from '@react-navigation/native'
import { Avatar, Button, Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import clsx from 'clsx'
import React from 'react'
import { Alert, TouchableOpacity, View } from 'react-native'

import { SearchedUpType, useSearchUps } from '@/api/search-up'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { NavigationProps } from '@/types'
import { parseNumber } from '@/utils'
import { useFollowedUpsMap } from '@/store/derives'

function SearchUpItem(props: { up: SearchedUpType }) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { $blackUps, set$followedUps, get$followedUps } = useStore()
  const _followedUpsMap = useFollowedUpsMap()

  const isFollowed = props.up.mid in _followedUpsMap
  const isBlackUp = '_' + props.up.mid in $blackUps
  return (
    <View className="flex-1 flex-row items-center justify-between px-4 mb-5">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          const { mid, face, name, sign } = props.up
          navigation.navigate('Dynamic', {
            user: {
              mid,
              face,
              name,
              sign,
            },
          })
        }}
        className="flex-1 flex-row items-center gap-4">
        <Avatar rounded source={{ uri: props.up.face }} size={40} />
        <Text
          numberOfLines={2}
          className={clsx(
            colors.primary.text,
            isBlackUp && `line-through ${colors.gray4.text}`,
            isFollowed && colors.secondary.text,
            'text-base flex-1',
          )}
          ellipsizeMode="tail">
          {props.up.name}
        </Text>
      </TouchableOpacity>
      <Text className={`${colors.gray6.text} text-sm px-2`}>
        {parseNumber(props.up.fans)}粉丝
      </Text>
      <Button
        size="sm"
        type="clear"
        disabled={isFollowed}
        onPress={() => {
          const user = {
            name: props.up.name,
            face: props.up.face,
            mid: props.up.mid,
            sign: props.up.sign,
          }
          if (isBlackUp) {
            Alert.alert('是否关注', '该UP在你的黑名单中', [
              {
                text: '否',
              },
              {
                text: '是',
                onPress: () => {
                  set$followedUps([user, ...get$followedUps()])
                },
              },
            ])
          } else {
            set$followedUps([user, ...get$followedUps()])
          }
        }}
        title={isFollowed ? '已关注' : '关注'}
      />
    </View>
  )
}

function EmptyContent(props: { loading: boolean }) {
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View
              className="flex-row items-center justify-between gap-4 mb-6 px-4"
              key={i}>
              <View className="flex-row items-center gap-4">
                <Skeleton
                  animation="pulse"
                  width={40}
                  className="rounded-full"
                  height={40}
                />
                <Skeleton animation="wave" width={100} height={20} />
                <Skeleton animation="wave" width={50} height={16} />
              </View>
              <Skeleton animation="wave" width={50} height={16} />
            </View>
          )
        })}
      </View>
    )
  }
  return <Text className="text-center my-10">暂无结果</Text>
}

function UpList(props: { keyword: string }) {
  const {
    data: searchedUps,
    isLoading,
    update,
    isReachingEnd,
    isValidating,
  } = useSearchUps(props.keyword)
  const listRef = React.useRef<FlashList<any> | null>(null)
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0 })
    }
  }, [props.keyword])
  return (
    <FlashList
      data={searchedUps}
      ref={listRef}
      keyExtractor={v => v.mid + ''}
      renderItem={({ item }: { item: SearchedUpType }) => {
        return <SearchUpItem up={item} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={<EmptyContent loading={isLoading} />}
      ListFooterComponent={
        isValidating ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
            加载中~
          </Text>
        ) : searchedUps?.length && isReachingEnd ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
            暂无更多
          </Text>
        ) : null
      }
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
      onEndReached={() => {
        update()
      }}
      onEndReachedThreshold={1}
    />
  )
}

export default React.memo(UpList)
