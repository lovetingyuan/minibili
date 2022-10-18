import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ToastAndroid,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getHotList } from '../../services/Bilibili';
import HotItem from './HotItem';
import TracyBtn from '../../components/TracyBtn';
import handleShare from '../../services/Share';
import { addBlackUser, getBlackUps } from './blackUps';
import { GetFuncPromiseType } from '../../types';
import { RootStackParamList } from '../../types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ButtonsOverlay from '../../components/ButtonsOverlay';
import useMemoizedFn from '../../hooks/useMemoizedFn';
import { TracyId } from '../../constants';
import { addBlackTag, getBlackTags } from './blackTags';
import useDialog from '../../hooks/useDialog';
import { AppContext } from '../../context';

type Props = BottomTabScreenProps<RootStackParamList, 'Hot'>;

type VideoItem = GetFuncPromiseType<typeof getHotList>['list'][0];

export default function Hot({ navigation, route }: Props) {
  // console.log(932424, route.params);
  const [state, setState] = React.useState<{
    page: number;
    list: [VideoItem, VideoItem?][];
    refreshing: boolean;
  }>({
    page: 1,
    list: [],
    refreshing: false,
  });
  const { playedVideos } = React.useContext(AppContext);
  const videosIdMap: Record<string, boolean> = {};
  state.list.forEach(item => {
    const [first, second] = item;
    videosIdMap[first.bvid] = true;
    if (second) {
      videosIdMap[second.bvid] = true;
    }
  });
  const hotListRef = React.useRef<FlatList | null>(null);
  const [initLoad, setInitLoad] = React.useState(true);

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
      hotListRef.current?.scrollToIndex({
        index: 0,
        animated: true,
      });
    });
    return unsubscribe;
  }, [navigation]);

  // const dialogContent = ;

  const { dialog, toggleDialog } = useDialog('不再看');

  const [hideWatched, setHideWatched] = React.useState(false);

  const filterWatched = useMemoizedFn(() => {
    setHideWatched(v => !v);
  });

  React.useEffect(() => {
    if (!route.params?.query) {
      return;
    }
    Promise.all([getBlackUps, getBlackTags]).then(([blackUps, tags]) => {
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
            {Object.keys(tags).length
              ? `类型：${Object.keys(tags).join(', ')}`
              : '类型：暂无'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 5,
              alignItems: 'center',
              // flex: 1,
            }}>
            <Text>不看已看过的</Text>
            <Switch value={hideWatched} onValueChange={filterWatched} />
          </View>
        </>,
      );
    });
  }, [route.params?.query, hideWatched]);
  const loadingRef = React.useRef(false);
  const moreRef = React.useRef(true);
  const currentVideoRef = React.useRef<VideoItem | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const layoutCallbackRef = React.useRef<any>(null);
  const addBlackUp = React.useCallback(async () => {
    if (!currentVideoRef.current) {
      return;
    }
    const blackUps = await addBlackUser(
      currentVideoRef.current.mid,
      currentVideoRef.current.name,
    );
    const newList: [VideoItem, VideoItem?][] = [];
    let current: [VideoItem?, VideoItem?] = [];
    for (let [item1, item2] of state.list) {
      if (!(item1.mid in blackUps)) {
        current.push(item1);
        if (current.length === 2) {
          newList.push(current as [VideoItem, VideoItem]);
          current = [];
        }
      }
      if (item2 && !(item2.mid in blackUps)) {
        current.push(item2);
        if (current.length === 2) {
          newList.push(current as [VideoItem, VideoItem]);
          current = [];
        }
      }
    }
    if (current.length) {
      newList.push(current as [VideoItem, VideoItem?]);
    }
    setState({
      ...state,
      list: newList,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoRef.current]);
  const addBlackTagName = React.useCallback(async () => {
    if (!currentVideoRef.current) {
      return;
    }
    const blackTags = await addBlackTag(currentVideoRef.current.tag);
    const newList: [VideoItem, VideoItem?][] = [];
    let current: [VideoItem?, VideoItem?] = [];
    for (let [item1, item2] of state.list) {
      if (!(item1.tag in blackTags)) {
        current.push(item1);
        if (current.length === 2) {
          newList.push(current as [VideoItem, VideoItem]);
          current = [];
        }
      }
      if (item2 && !(item2.tag in blackTags)) {
        current.push(item2);
        if (current.length === 2) {
          newList.push(current as [VideoItem, VideoItem]);
          current = [];
        }
      }
    }
    if (current.length) {
      newList.push(current as [VideoItem, VideoItem?]);
    }
    setState({
      ...state,
      list: newList,
    });
  }, [currentVideoRef.current]);
  const renderItem = ({ item }: { item: [VideoItem, VideoItem?] }) => {
    const key = item[0].bvid + (item[1] ? item[1].bvid : 'n/a');
    return (
      <View
        key={key}
        style={styles.itemContainer}
        onLayout={e => {
          const height = e.nativeEvent.layout.height;
          if (!layoutCallbackRef.current) {
            layoutCallbackRef.current = (data: any, index: number) => {
              return {
                length: height,
                offset: height * index,
                index,
              };
            };
          }
        }}>
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
          <HotItem video={item[0]} />
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
            <HotItem video={item[1]} />
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, marginVertical: 12, marginHorizontal: 6 }} />
        )}
      </View>
    );
  };
  const loadMoreHotItems = async () => {
    if (loadingRef.current || !moreRef.current) {
      return;
    }
    loadingRef.current = true;
    const blackUps = await getBlackUps;
    const blackTags = await getBlackTags;

    getHotList(state.page)
      .then(
        ({ more, list }) => {
          moreRef.current = more;
          const last = state.list[state.list.length - 1];
          list = list.filter(v => {
            if (videosIdMap[v.bvid]) {
              return false;
            }
            if (v.tag in blackTags) {
              return false;
            }
            if (v.mid in blackUps) {
              return false;
            }
            if (hideWatched && v.mid in playedVideos) {
              return false;
            }
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
    {
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
      <FlatList
        data={state.list}
        ref={hotListRef}
        renderItem={renderItem}
        refreshing={state.refreshing}
        onEndReachedThreshold={0.4}
        onRefresh={resetDynamicItems}
        onEndReached={loadMoreHotItems}
        {...(layoutCallbackRef.current
          ? {
              getItemLayout: layoutCallbackRef.current,
            }
          : null)}
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
        style={styles.listContainerStyle}
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
  listContainerStyle: { paddingTop: 18, paddingHorizontal: 6 },
  bottomEnd: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 30,
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
