import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  // FlatList,
  ToastAndroid,
  Alert,
  Linking,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getHotList } from '../../services/Bilibili';
import HotItem from './HotItem';
import TracyBtn from '../../components/TracyBtn';
import handleShare from '../../services/Share';
// import { addBlackUser, getBlackUps } from './blackUps';
import { GetFuncPromiseType } from '../../types';
import { RootStackParamList } from '../../types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ButtonsOverlay from '../../components/ButtonsOverlay';
import useMemoizedFn from '../../hooks/useMemoizedFn';
import { TracyId } from '../../constants';
// import { addBlackTag, getBlackTags } from './blackTags';
import useDialog from '../../hooks/useDialog';
import { FlashList } from '@shopify/flash-list';
import store from '../../valtio/store';
import { useSnapshot } from 'valtio';

type Props = BottomTabScreenProps<RootStackParamList, 'Hot'>;

type VideoItem = GetFuncPromiseType<typeof getHotList>['list'][0];

export default function Hot({ navigation, route }: Props) {
  const [state, setState] = React.useState<{
    page: number;
    list: [VideoItem, VideoItem?][];
    refreshing: boolean;
  }>({
    page: 1,
    list: [],
    refreshing: false,
  });
  const videosIdMap: Record<string, boolean> = {};
  state.list.forEach(item => {
    const [first, second] = item;
    videosIdMap[first.bvid] = true;
    if (second) {
      videosIdMap[second.bvid] = true;
    }
  });
  const hotListRef = React.useRef<any>(null);
  const [initLoad, setInitLoad] = React.useState(true);
  const { blackUps, blackTags } = useSnapshot(store);
  // const snapshot = useSnapshot(store);
  // console.log(932424, route.name);

  if (!initLoad) {
    SplashScreen.hideAsync();
  }
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return;
      }
      state.list.length &&
        hotListRef.current?.scrollToOffset({
          offset: 0,
        });
    });
    return unsubscribe;
  }, [navigation, state.list]);

  const { dialog, toggleDialog } = useDialog('不再看');

  React.useEffect(() => {
    if (!route.params?.query) {
      return;
    }
    toggleDialog(
      <>
        <Text>
          {Object.keys(blackUps).length
            ? `UP(${Object.keys(blackUps).length})：${Object.values(blackUps)
                .filter(v => typeof v === 'string')
                .join(', ')}`
            : 'UP：暂无'}
        </Text>
        <Text> </Text>
        <Text>
          {Object.keys(blackTags).length
            ? `类型：${Object.keys(blackTags).join(', ')}`
            : '类型：暂无'}
        </Text>
        {/* <View
            style={{
              flexDirection: 'row',
              marginTop: 5,
              alignItems: 'center',
            }}>
            <Text>不看已看过的</Text>
            <Switch value={hideWatched} onValueChange={filterWatched} />
          </View> */}
      </>,
    );
  }, [route.params?.query]);
  const loadingRef = React.useRef(false);
  const moreRef = React.useRef(true);
  const currentVideoRef = React.useRef<VideoItem | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const addBlackUp = React.useCallback(async () => {
    if (!currentVideoRef.current) {
      return;
    }
    const { mid, name } = currentVideoRef.current;
    store.blackUps['_' + mid] = name;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoRef.current]);
  const addBlackTagName = () => {
    if (!currentVideoRef.current) {
      return;
    }
    const { tag } = currentVideoRef.current;
    store.blackTags[tag] = true;
    // console.log(242342, store.blackTags);
    // const blackTags = await addBlackTag(currentVideoRef.current.tag);
  };

  // React.useEffect(() => {
  //   if (!Object.keys(blackTags).length) {
  //     return;
  //   }
  //   console.log('tag changed', blackTags, state.list[0]?.[1]);
  //   const newList: [VideoItem, VideoItem?][] = [];
  //   let current: [VideoItem?, VideoItem?] = [];
  //   for (let [item1, item2] of state.list) {
  //     if (!(item1.tag in blackTags)) {
  //       current.push(item1);
  //       if (current.length === 2) {
  //         newList.push(current as [VideoItem, VideoItem]);
  //         current = [];
  //       }
  //     }
  //     if (item2 && !(item2.tag in blackTags)) {
  //       current.push(item2);
  //       if (current.length === 2) {
  //         newList.push(current as [VideoItem, VideoItem]);
  //         current = [];
  //       }
  //     }
  //   }
  //   if (current.length) {
  //     newList.push(current as [VideoItem, VideoItem?]);
  //   }
  //   setState({
  //     ...state,
  //     list: newList,
  //   });
  //   console.log('5555555555', newList[0]);
  // }, [blackTags]);
  // React.useEffect(() => {
  //   const newList: [VideoItem, VideoItem?][] = [];
  //   let current: [VideoItem?, VideoItem?] = [];
  //   for (let [item1, item2] of state.list) {
  //     if (!(item1.mid in blackUps)) {
  //       current.push(item1);
  //       if (current.length === 2) {
  //         newList.push(current as [VideoItem, VideoItem]);
  //         current = [];
  //       }
  //     }
  //     if (item2 && !(item2.mid in blackUps)) {
  //       current.push(item2);
  //       if (current.length === 2) {
  //         newList.push(current as [VideoItem, VideoItem]);
  //         current = [];
  //       }
  //     }
  //   }
  //   if (current.length) {
  //     newList.push(current as [VideoItem, VideoItem?]);
  //   }
  //   setState({
  //     ...state,
  //     list: newList,
  //   });
  // }, [blackUps]);
  const renderItem = ({ item }: { item: [VideoItem, VideoItem?] }) => {
    const key = item[0].bvid + (item[1] ? item[1].bvid : 'n/a');
    return (
      <View key={key} style={styles.itemContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{ flex: 1 }}
          onPress={() => {
            navigation.navigate('Play', {
              mid: item[0].mid,
              bvid: item[0].bvid,
              name: item[0].name,
              aid: item[0].aid,
            });
          }}
          onLongPress={() => {
            currentVideoRef.current = item[0];
            setModalVisible(true);
          }}>
          <HotItem
            video={item[0]}
            key={item[0].bvid}
            itemStyle={{ marginLeft: 10, marginRight: 6 }}
          />
        </TouchableOpacity>
        {item[1] ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1 }}
            onPress={() => {
              navigation.navigate('Play', {
                mid: item[1]!.mid,
                bvid: item[1]!.bvid,
                name: item[1]!.name,
                aid: item[1]!.aid,
              });
            }}
            onLongPress={() => {
              currentVideoRef.current = item[1]!;
              setModalVisible(true);
            }}>
            <HotItem
              video={item[1]}
              key={item[0].bvid}
              itemStyle={{ marginRight: 10, marginLeft: 6 }}
            />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flex: 1,
              marginVertical: 12,
              marginRight: 10,
              marginLeft: 6,
            }}
          />
        )}
      </View>
    );
  };
  const loadMoreHotItems = async () => {
    if (loadingRef.current || !moreRef.current) {
      return;
    }
    loadingRef.current = true;

    getHotList(state.page)
      .then(
        ({ more, list }) => {
          moreRef.current = more;
          const last = state.list[state.list.length - 1];
          list = list.filter(v => {
            if (videosIdMap[v.bvid]) {
              // 为了去重，有时候会有重复的视频
              return false;
            }
            if (v.tag in blackTags) {
              return false;
            }
            if ('_' + v.mid in blackUps) {
              return false;
            }
            // if (hideWatched && v.mid in playedVideos) {
            //   return false;
            // }
            return true;
          });
          if (!list.length) {
            loadingRef.current = false;
            setState({
              ...state,
              page: state.page + 1,
            });
            return;
          }
          if (last && last.length === 1) {
            last.push(list.shift());
          }
          const viewList: [VideoItem, VideoItem?][] = [];
          for (let i = 0; i < list.length; i = i + 2) {
            if (list[i + 1]) {
              viewList.push([list[i], list[i + 1]]);
            } else {
              viewList.push([list[i]]);
            }
          }
          setState({
            ...state,
            page: state.page + 1,
            list: state.list.concat(viewList),
          });
          // console.log(2222, blackTags, blackUps, store.blackTags);
          // 为了触发过滤，因为black是异步数据，第一次快照的black列表还是空的
          // store.blackTags = { ...store.blackTags };
          // store.blackUps = { ...store.blackUps };
        },
        err => {
          __DEV__ && console.log(err);
          ToastAndroid.show('请求热门失败', ToastAndroid.SHORT);
        },
      )
      .finally(() => {
        loadingRef.current = false;
      });
  };
  const resetDynamicItems = () => {
    loadingRef.current = false;
    moreRef.current = true;
    setState({
      page: 1,
      list: [],
      refreshing: false,
    });
    setInitLoad(true);
  };
  if (initLoad) {
    setInitLoad(false);
    loadMoreHotItems();
  }

  const onShare = async () => {
    if (currentVideoRef.current) {
      setModalVisible(false);
      const { name, title, bvid } = currentVideoRef.current;
      handleShare(name, title, bvid);
    }
  };
  const handleOverlayClick = useMemoizedFn((name: string) => {
    if (name === 'black') {
      setModalVisible(false);
      Alert.alert(`不再看 ${currentVideoRef.current?.name} 的视频？`, '', [
        {
          text: '取消',
          style: 'cancel',
        },
        { text: '确定', onPress: addBlackUp },
      ]);
    } else if (name === 'blackByTag') {
      Alert.alert(`不再看 ${currentVideoRef.current?.tag} 类型的视频？`, '', [
        {
          text: '取消',
          style: 'cancel',
        },
        { text: '确定', onPress: addBlackTagName },
      ]);
    } else if (name === 'share') {
      onShare();
    } else if (name === 'openApp') {
      if (!currentVideoRef.current) {
        return;
      }
      setModalVisible(false);
      Linking.openURL(`bilibili://video/${currentVideoRef.current.bvid}`).catch(
        err => {
          if (err.message.includes('No Activity found to handle Intent')) {
            ToastAndroid.show('未安装B站', ToastAndroid.SHORT);
          }
          navigation.navigate('WebPage', {
            title: currentVideoRef.current!.name + '的动态',
            url:
              'https://m.bilibili.com/video/' + currentVideoRef.current!.bvid,
          });
        },
      );
    }
  });
  const buttons = [
    currentVideoRef.current?.mid == TracyId
      ? null
      : {
          text: `不再看 ${currentVideoRef.current?.name} 的视频`,
          name: 'black',
        },
    currentVideoRef.current?.mid == TracyId
      ? null
      : {
          text: `不再看 ${currentVideoRef.current?.tag} 类型的视频`,
          name: 'blackByTag',
        },
    {
      text: `分享(${currentVideoRef.current?.shareNum})`,
      name: 'share',
    },
    {
      text: '在B站打开',
      name: 'openApp',
    },
  ].filter(Boolean);
  const hotVideoList: [VideoItem, VideoItem?][] = [];
  let current: [VideoItem?, VideoItem?] = [];
  for (let [item1, item2] of state.list) {
    if (!('_' + item1.mid in blackUps) && !(item1.tag in blackTags)) {
      current.push(item1);
      if (current.length === 2) {
        hotVideoList.push(current as [VideoItem, VideoItem]);
        current = [];
      }
    }
    if (item2 && !('_' + item2.mid in blackUps) && !(item2.tag in blackTags)) {
      current.push(item2);
      if (current.length === 2) {
        hotVideoList.push(current as [VideoItem, VideoItem]);
        current = [];
      }
    }
  }
  if (current.length) {
    hotVideoList.push(current as [VideoItem, VideoItem?]);
  }
  return (
    <View style={styles.container}>
      {dialog}
      <ButtonsOverlay
        visible={modalVisible}
        overlayStyle={{ minWidth: 220 }}
        buttons={buttons}
        onPress={handleOverlayClick}
        dismiss={() => setModalVisible(false)}
      />
      <FlashList
        ref={v => {
          hotListRef.current = v;
        }}
        data={hotVideoList}
        renderItem={renderItem}
        estimatedItemSize={200}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
          </Text>
        }
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {moreRef.current ? '加载中...' : `到底了~(${state.list.length})`}
          </Text>
        }
        onEndReached={loadMoreHotItems}
        onEndReachedThreshold={0.4}
        refreshing={state.refreshing}
        onRefresh={resetDynamicItems}
        contentContainerStyle={styles.listContainerStyle}
      />
      <TracyBtn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  listContainerStyle: { paddingTop: 14 },
  bottomEnd: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 100,
    fontSize: 18,
    color: '#fb7299',
  },
  popupBtn: {
    justifyContent: 'flex-start',
    marginVertical: 5,
  },
});
