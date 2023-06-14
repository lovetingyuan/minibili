import React from 'react'
import { StyleSheet, View } from 'react-native'
import { RootStackParamList } from '../../types'

import { DynamicItemAllType, useDynamicItems } from '../../api/dynamic-items'
import { HeaderLeft, HeaderRight } from './Header'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Icon, Text, useTheme, Skeleton } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import DynamicItem from './DynamicItem'
import { useUserInfo } from '../../api/user-info'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingUpMid } from '../../utils/report'
import { showToast } from '../../utils'

type Props = NativeStackScreenProps<RootStackParamList, 'Dynamic'>

const Loading = React.memo(() => {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View
              style={{ padding: 10, gap: 15, marginBottom: 10, marginTop: 10 }}
              key={i}>
              {i % 2 === 0 ? (
                <View style={{ gap: 8 }}>
                  <Skeleton
                    animation="pulse"
                    width={'80%' as any}
                    height={15}
                  />
                  <Skeleton
                    animation="pulse"
                    width={'33%' as any}
                    height={15}
                  />
                  <Skeleton animation="pulse" height={15} />
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Skeleton animation="pulse" width={'45%' as any} height={80} />
                <View
                  style={{ gap: 10, justifyContent: 'space-between', flex: 1 }}>
                  <Skeleton
                    animation="pulse"
                    width={'70%' as any}
                    height={15}
                  />
                  <Skeleton
                    animation="pulse"
                    width={'50%' as any}
                    height={15}
                  />
                </View>
              </View>
            </View>
          )
        })}
    </View>
  )
})

const Dynamic: React.FC<Props> = function Dynamic({ navigation, route }) {
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
    loading,
    refresh,
    isReachingEnd,
    error,
  } = useDynamicItems(upId)
  React.useEffect(() => {
    if (error) {
      showToast('请求动态失败')
    }
  }, [upId, error])
  const { theme } = useTheme()

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
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
      },
      headerRight: () => <HeaderRight />,
    })
  }, [navigation])
  const renderItem = ({ item }: { item: DynamicItemAllType }) => {
    return <DynamicItem item={item} />
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={list}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReachedThreshold={1}
        ref={dynamicListRef}
        estimatedItemSize={100}
        ListHeaderComponent={
          dynamicUser?.sign && dynamicUser?.sign !== '-' ? (
            <View style={styles.signTextContainer}>
              <Icon
                name="billboard"
                type="material-community"
                size={18}
                style={styles.signMark}
                color={theme.colors.grey0}
              />
              <Text style={[styles.signText, { color: theme.colors.grey0 }]}>
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
        ListEmptyComponent={
          <>
            {loading && !isReachingEnd ? (
              <Loading />
            ) : error ? (
              <Text style={{ margin: 50, textAlign: 'center', fontSize: 16 }}>
                加载失败
              </Text>
            ) : null}
          </>
        }
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {isReachingEnd
              ? list.length
                ? '到底了~'
                : '暂无动态'
              : loading
              ? '加载中...'
              : ''}
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomEnd: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
    color: '#999',
    textAlign: 'center',
    // fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 30,
    marginBottom: 10,
    fontSize: 18,
    color: '#fb7299',
    textAlign: 'center',
  },
  listStyle: { paddingTop: 15 },
  signTextContainer: {
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaa',
    paddingVertical: 10,
    flex: 1,
    flexDirection: 'row',
  },
  signText: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 10,
    flexShrink: 1,
    opacity: 0.8,
    // color: '#666',
  },

  signMark: {
    position: 'relative',
    top: 3,
  },
  itemContainer: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
})

export default Dynamic
