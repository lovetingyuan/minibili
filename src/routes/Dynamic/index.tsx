import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Icon, Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Image, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import {
  type DynamicItemAllType,
  useDynamicItems,
} from '../../api/dynamic-items'
import { useUserInfo } from '../../api/user-info'
import useErrToast from '../../hooks/useErrToast'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { RootStackParamList } from '../../types'
import { setViewingUpMid } from '../../utils/report'
import DynamicItem from './DynamicItem'
import { HeaderLeft, headerRight } from './Header'

type Props = NativeStackScreenProps<RootStackParamList, 'Dynamic'>

function LoadingComp() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="p-3 gap-4 my-2" key={i}>
              {i % 2 === 0 ? (
                <View className="gap-2">
                  <Skeleton
                    animation="wave"
                    width={(Math.floor(Math.random() * 81) + 10 + '%') as any}
                    height={15}
                  />
                  {Math.random() > 0.5 ? (
                    <Skeleton
                      animation="wave"
                      width={(Math.floor(Math.random() * 81) + 10 + '%') as any}
                      height={15}
                    />
                  ) : null}
                  <Skeleton
                    width={(Math.floor(Math.random() * 81) + 10 + '%') as any}
                    animation="wave"
                    height={15}
                  />
                </View>
              ) : null}
              <View className="flex-row gap-3">
                <Skeleton animation="pulse" width={'55%' as any} height={110} />
                <View className="gap-3 justify-between flex-1">
                  <Skeleton
                    animation="wave"
                    width={(Math.floor(Math.random() * 81) + 10 + '%') as any}
                    height={15}
                  />
                  <Skeleton
                    animation="wave"
                    width={(Math.floor(Math.random() * 81) + 10 + '%') as any}
                    height={15}
                  />
                </View>
              </View>
            </View>
          )
        })}
    </View>
  )
}

const Loading = React.memo(LoadingComp)

export default React.memo(Dynamic)

function Dynamic({ navigation, route }: Props) {
  const upId = route.params?.user?.mid // || specialUser?.mid
  const dynamicListRef = React.useRef<any>(null)
  const { data: userInfo } = useUserInfo(upId)
  const dynamicUser = {
    ...route.params?.user,
    ...userInfo,
  }
  useFocusEffect(
    useMemoizedFn(() => {
      upId && setViewingUpMid(upId)
      return () => {
        setViewingUpMid(null)
      }
    }),
  )
  const {
    list,
    page,
    setSize,
    isRefreshing,
    isLoading,
    isValidating,
    refresh,
    isReachingEnd,
    error,
  } = useDynamicItems(upId)
  useErrToast('请求动态失败', error)
  const headerTitle = React.useCallback(() => {
    return (
      <HeaderLeft
        scrollTop={() => {
          try {
            dynamicListRef.current?.scrollToOffset({
              offset: 0,
            })
          } catch (err) {}
        }}
      />
    )
  }, [])

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle,
      headerRight,
    })
  }, [navigation, headerTitle])
  const renderItem = ({ item }: { item: DynamicItemAllType }) => {
    return <DynamicItem item={item} />
  }
  const footerContent = () => {
    if (!list.length) {
      return null
    }
    return (
      <Text className="text-sm mt-3 mb-5 text-center text-gray-500">
        {isReachingEnd ? '到底了~' : isValidating ? '加载中...' : ''}
      </Text>
    )
  }
  const emptyContent = () => {
    if (isLoading) {
      return <Loading />
    }
    if (error) {
      return <Text className="m-12 text-base text-center">加载动态失败</Text>
    }
    return (
      <View className="items-center py-24">
        <Image
          source={require('../../../assets/empty.png')}
          className="aspect-square h-auto w-[40%]"
        />
        <Text className="m-10 text-lg text-center">暂无动态</Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <FlashList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReachedThreshold={1}
        ref={dynamicListRef}
        estimatedItemSize={100}
        ListHeaderComponent={
          dynamicUser?.sign && dynamicUser?.sign !== '-' ? (
            <View className="px-3 border-b-[0.5px] py-3 flex-row border-b-gray-400">
              <Icon
                name="billboard"
                type="material-community"
                size={18}
                color={tw(colors.gray6.text).color}
              />
              <Text className="text-sm ml-2 shrink-0 flex-1 text-gray-600 dark:text-gray-400">
                {dynamicUser?.sign.trim()}
              </Text>
            </View>
          ) : null
        }
        onEndReached={() => {
          setSize(page + 1)
        }}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListEmptyComponent={emptyContent()}
        ListFooterComponent={footerContent()}
      />
    </View>
  )
}
