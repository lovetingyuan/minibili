import { useNavigation } from '@react-navigation/native'
import { Avatar, Button, Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { SearchedUpType, useSearchUps } from '@/api/search-up'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { NavigationProps } from '@/types'
import { parseNumber } from '@/utils'

function SearchUpItem(props: { up: SearchedUpType }) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { _followedUpsMap, set$followedUps, get$followedUps } = useStore()
  const isFollowed = props.up.mid in _followedUpsMap

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
          className={`${colors.primary.text} ${isFollowed ? colors.secondary.text : ''} text-base flex-1`}
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
          set$followedUps([user, ...get$followedUps()])
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
  // const { searchingUpsKeyWord } = useStore()
  const { data: searchedUps, isLoading } = useSearchUps(props.keyword)
  const listRef = React.useRef<any>(null)
  // const upList = []
  return (
    <FlashList
      ref={v => {
        listRef.current = v
      }}
      // numColumns={2}
      data={searchedUps}
      keyExtractor={v => v.mid + ''}
      renderItem={({ item }: { item: SearchedUpType }) => {
        return <SearchUpItem up={item} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={<EmptyContent loading={isLoading} />}
      ListFooterComponent={null}
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
      // {...refreshProps}
      onEndReached={() => {}}
      onEndReachedThreshold={1}
    />
  )
}

export default React.memo(UpList)
