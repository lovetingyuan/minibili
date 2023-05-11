import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ToastAndroid,
  BackHandler,
  ActivityIndicator,
} from 'react-native'
import { RootStackParamList } from '../../types'

import { DynamicItemAllType, useDynamicItems } from '../../api/dynamic-items'
import { HeaderLeft, HeaderRight } from './Header'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Icon } from '@rneui/themed'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import useMounted from '../../hooks/useMounted'
import { FlashList } from '@shopify/flash-list'
import { useStore } from '../../store'
import DynamicItem from './DynamicItem'

type Props = NativeStackScreenProps<RootStackParamList, 'Dynamic'>

const Dynamic: React.FC<Props> = function Dynamic({ navigation, route }) {
  __DEV__ && console.log(route.name)
  const dynamicUser = useStore().dynamicUser!
  const upId = dynamicUser.mid // || specialUser?.mid
  const dynamicListRef = React.useRef<any>(null)

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
      ToastAndroid.show('请求动态失败', ToastAndroid.SHORT)
    }
  }, [upId, error])

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        return (
          <HeaderLeft
            style={{ position: 'relative', left: -10 }}
            scrollTop={() => {
              dynamicListRef.current?.scrollToOffset({
                offset: 0,
              })
            }}
          />
        )
      },
      headerTitleAlign: 'left',
      headerRight: () => <HeaderRight />,
    })
  }, [navigation])
  const handleBack = useMemoizedFn(() => {
    if (route.params?.from === 'followed' && navigation.isFocused()) {
      navigation.navigate('Follow')
      return true
    }
    return false
  })
  useMounted(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBack)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBack)
    }
  })

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
          dynamicUser.sign && dynamicUser.sign !== '-' ? (
            <View style={styles.signTextContainer}>
              <Icon
                name="billboard"
                type="material-community"
                size={16}
                style={styles.signMark}
              />
              <Text style={styles.signText}>{dynamicUser.sign.trim()}</Text>
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
            <Text style={styles.emptyText}>
              哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
            </Text>
            {loading ? (
              <View>
                <ActivityIndicator
                  color="blue"
                  animating
                  size={'large'}
                  style={{ marginTop: 30 }}
                />
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {isReachingEnd ? '到底了~' : loading ? '加载中...' : ''}
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
    fontSize: 12,
    marginTop: 10,
    marginBottom: 20,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 100,
    marginBottom: 100,
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
    color: '#666',
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
