import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Skeleton } from '@rneui/themed'
// import { FlashList } from '@shopify/flash-list'
import React, { useCallback, useEffect, useRef } from 'react'
import { BackHandler, Linking, Platform, Share, View } from 'react-native'
import WebView from 'react-native-webview'

// import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useStore } from '@/store'
import { showToast } from '@/utils'

// import {
//   type DynamicItemAllType,
//   useDynamicItems,
// } from '../../api/dynamic-items'
// import { useUserInfo } from '../../api/user-info'
// import useErrToast from '../../hooks/useErrToast'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { NavigationProps, RootStackParamList } from '../../types'
import { setViewingUpMid } from '../../utils/report'
import { av2bv } from './avbv'
// import DynamicItem from './DynamicItem'
import { HeaderLeft, headerRight } from './Header'
import injectCode from './inject'

type Props = NativeStackScreenProps<RootStackParamList, 'Dynamic'>

function LoadingComp() {
  return (
    <View>
      {Array(10)
        .fill(null)
        .map((_, i) => {
          return (
            <View className="my-2 gap-4 p-3" key={i}>
              {i % 2 === 0 ? (
                <View className="gap-2">
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    height={15}
                  />
                  {Math.random() > 0.5 ? (
                    <Skeleton
                      animation="wave"
                      width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                      height={15}
                    />
                  ) : null}
                  <Skeleton
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    animation="wave"
                    height={15}
                  />
                </View>
              ) : null}
              <View className="flex-row gap-3">
                <Skeleton animation="pulse" width={'45%' as any} height={95} />
                <View className="flex-1 justify-between gap-3">
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
                    height={15}
                  />
                  <Skeleton
                    animation="wave"
                    width={`${Math.floor(Math.random() * 81) + 10}%` as any}
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

function Dynamic({ route }: Props) {
  const upId = route.params?.user?.mid // || specialUser?.mid
  const dynamicListRef = React.useRef<any>(null)
  // const { data: userInfo } = useUserInfo(upId)
  // const dynamicUser = {
  //   ...route.params?.user,
  //   ...userInfo,
  // }
  const { reloadUerProfile, dynamicOpenUrl, setDynamicOpenUrl } = useStore()
  const webviewRef = useRef<WebView>(null)
  const navigation = useNavigation<NavigationProps['navigation']>()

  useFocusEffect(
    useMemoizedFn(() => {
      upId && setViewingUpMid(upId)
      return () => {
        setViewingUpMid(null)
      }
    }),
  )
  // const {
  //   list,
  //   page,
  //   setSize,
  //   isRefreshing,
  //   isLoading,
  //   isValidating,
  //   refresh,
  //   isReachingEnd,
  //   error,
  // } = useDynamicItems(upId)
  // useErrToast('请求动态失败', error)

  useUpdateNavigationOptions(
    React.useMemo(() => {
      const headerTitle = () => {
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
      }
      return {
        headerTitle,
        headerRight,
      }
    }, []),
  )
  const currentNavigationStateRef = React.useRef<{
    canGoBack: boolean
    title: string
    url: string
    init?: boolean
  }>({
    canGoBack: false,
    title: '',
    url: '',
    init: true,
  })
  useFocusEffect(
    useCallback(() => {
      const onAndroidBackPress = () => {
        if (currentNavigationStateRef.current.canGoBack && webviewRef.current) {
          webviewRef.current.goBack()
          return true
        }
        return false
      }
      if (Platform.OS === 'android') {
        BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress)

        return () => {
          BackHandler.removeEventListener(
            'hardwareBackPress',
            onAndroidBackPress,
          )
        }
      }
    }, []),
  )
  useEffect(() => {
    if (dynamicOpenUrl) {
      setDynamicOpenUrl(0)
      webviewRef.current?.injectJavaScript(`
        window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: 'open-url',
          payload: {
            url: location.href
          },
        }),
      )
        `)
    }
  }, [dynamicOpenUrl, setDynamicOpenUrl])
  // const renderItem = ({ item }: { item: DynamicItemAllType }) => {
  //   return <DynamicItem item={item} />
  // }
  // const footerContent = () => {
  //   if (!list.length) {
  //     return null
  //   }
  //   return (
  //     <Text className="mb-5 mt-3 text-center text-sm text-gray-500">
  //       {isReachingEnd ? '到底了~' : isValidating ? '加载中...' : ''}
  //     </Text>
  //   )
  // }
  // const emptyContent = () => {
  //   if (isLoading) {
  //     return <Loading />
  //   }
  //   if (error) {
  //     return <Text className="m-12 text-center text-base">加载动态失败</Text>
  //   }
  //   return (
  //     <View className="items-center py-24">
  //       <Image
  //         source={require('../../../assets/empty.png')}
  //         className="aspect-square h-auto w-[40%]"
  //       />
  //       <Text className="m-10 text-center text-lg">暂无动态</Text>
  //     </View>
  //   )
  // }
  useEffect(() => {
    // const a = webviewRef.current?
    if (reloadUerProfile) {
      // webviewRef.current?.reload()
      webviewRef.current?.injectJavaScript(`
        window.location.reload()
      `)
    }
  }, [reloadUerProfile])

  return (
    <View className="flex-1">
      {/* <FlashList
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={1}
        ref={dynamicListRef}
        estimatedItemSize={100}
        ListHeaderComponent={
          dynamicUser?.sign && dynamicUser?.sign !== '-' ? (
            <View className="flex-row border-b-[0.5px] border-b-gray-400 px-3 py-3">
              <Icon
                name="billboard"
                type="material-community"
                size={18}
                color={tw(colors.gray6.text).color}
              />
              <Text className="ml-2 flex-1 shrink-0 text-sm text-gray-600 dark:text-gray-400">
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
      /> */}
      {/* {dynamicUser?.sign && dynamicUser?.sign !== '-' ? (
        <View className="flex-row border-b-[0.5px] border-b-gray-400 px-3 py-3">
          <Icon
            name="billboard"
            type="material-community"
            size={18}
            color={tw(colors.gray6.text).color}
          />
          <Text className="ml-2 flex-1 shrink-0 text-sm text-gray-600 dark:text-gray-400">
            {dynamicUser?.sign.trim()}
          </Text>
        </View>
      ) : null} */}
      <WebView
        className="flex-1"
        source={{ uri: `https://m.bilibili.com/space/${upId}` }}
        // key={webViewMode + '-' + webviewKey}
        // onScroll={(e) => setEnabled(e.nativeEvent.contentOffset.y === 0)}
        originWhitelist={['http://*', 'https://*', 'bilibili://*']}
        allowsFullscreenVideo
        injectedJavaScriptForMainFrameOnly
        allowsInlineMediaPlayback
        startInLoadingState
        pullToRefreshEnabled
        // applicationNameForUserAgent={'BILIBILI/8.0.0'}
        // allowsBackForwardNavigationGestures
        mediaPlaybackRequiresUserAction={false}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={''}
        injectedJavaScriptBeforeContentLoaded={injectCode}
        renderLoading={() => <Loading />}
        onNavigationStateChange={(navState) => {
          currentNavigationStateRef.current = {
            canGoBack: navState.canGoBack,
            title: navState.title,
            url: navState.url,
          }
          // setFabKey(fabKey + 1)
        }}
        userAgent="Mozilla/5.0 (Linux; Android 13; M2012K11AC Build/TKQ1.220829.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.115 Mobile Safari/537.36"
        // userAgent={webViewMode === 'MOBILE' ? '' : UA}
        ref={webviewRef}
        onMessage={(evt) => {
          const data = JSON.parse(evt.nativeEvent.data) as any
          if (data.action === 'open-video') {
            const { av, title, mid, name, face } = data.payload
            const bvid = av2bv(av)

            navigation.navigate('Play', {
              // aid: data.aid,
              bvid: bvid,
              title: title,
              mid,
              name,
              face,
              // title: data.title,
              // desc: data.desc,
              // mid: data.mid,
              // face: data.face,
              // name: data.name,
              // cover: data.cover,
              // date: data.date,
              // tag: data.tag,
              // video: data,
            })
            // navigation.navigate('Video', {
            //   av,
            // })
          } else if (data.action === 'share-content') {
            const { link, texts } = data.payload
            // console.log(99, link, texts)
            Share.share({
              message:
                (texts.length > 100 ? texts.slice(0, 100) + '...' : texts) +
                '\n' +
                link,
              // title: texts,
              // url: link,
            })
          } else if (data.action === 'open-url') {
            const { url } = data.payload
            Linking.openURL(url)
          }
        }}
        onLoad={() => {}}
        onError={() => {
          showToast('加载失败')
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (!request.url.startsWith('http')) {
            return false
          }
          if (request.url.split('?')[0].endsWith('.apk')) {
            return false
          }
          const forbiddenUrls = ['data.bilibili.com']
          if (
            forbiddenUrls.some((v) => {
              return request.url.includes(v)
            })
          ) {
            return false
          }
          return true
        }}
        onContentProcessDidTerminate={() => {
          webviewRef.current?.reload()
        }}
      />
    </View>
  )
}
