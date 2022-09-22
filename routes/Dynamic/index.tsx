import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ToastAndroid,
  BackHandler,
} from 'react-native';
import { getDynamicItems } from '../../services/Bilibili';
// import { setLatest } from '../../services/Updates';
import { DynamicItem, DynamicType } from '../../types';
import ForwardItem from './ForwardItem';
import Header from './Header';
import RichTextItem from './RichTextItem';
import VideoItem from './VideoItem';
import { RootStackParamList } from '../../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AppContext } from '../../context';

type Props = BottomTabScreenProps<RootStackParamList, 'Dynamic'>;

export default function BackgroundFetchScreen({ navigation, route }: Props) {
  __DEV__ && console.log(route.name);

  const [dynamicItems, setDynamicItems] = React.useState<DynamicItem[]>([]);
  const pageInfoRef = React.useRef<{
    hasMore: boolean;
    offset: string;
    init?: boolean;
  }>({
    hasMore: true,
    offset: '',
    init: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const { specialUser } = React.useContext(AppContext);
  const upId = route.params?.mid || specialUser?.mid;
  const dynamicListRef = React.useRef<FlatList | null>(null);
  const [initLoad, setInitLoad] = React.useState(true);
  const [refreshHead, setRefreshHead] = React.useState(0);
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return;
      }
      dynamicListRef.current?.scrollToIndex({
        index: 0,
        animated: true,
      });
    });
    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    const follow = route.params?.follow;
    const handler = function () {
      if (navigation.isFocused() && follow) {
        navigation.navigate('Follow');
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', handler);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handler);
    };
  }, [upId, navigation, route.params]);
  const renderItem = ({ item }: any) => {
    let Item: any = null;
    if (item.type === DynamicType.Video) {
      Item = VideoItem;
    }
    if (item.type === DynamicType.Draw) {
      Item = RichTextItem;
    }
    if (
      item.type === DynamicType.ForwardDraw ||
      item.type === DynamicType.ForwardVideo ||
      item.type === DynamicType.ForwardOther
    ) {
      Item = ForwardItem;
    }
    return (
      <View style={styles.itemContainer}>
        <Item {...item} />
      </View>
    );
  };
  const loadMoreDynamicItems = React.useCallback(() => {
    const { offset, hasMore } = pageInfoRef.current;
    if (loading || !hasMore) {
      return;
    }
    if (!upId) {
      return;
    }
    setLoading(true);
    getDynamicItems(offset, upId)
      .then(
        ({ more, items, offset: os }) => {
          if (!pageInfoRef.current.offset) {
            setDynamicItems(items);
          } else {
            setDynamicItems(dynamicItems.concat(items));
          }
          pageInfoRef.current.hasMore = more;
          pageInfoRef.current.offset = os;
        },
        () => {
          ToastAndroid.show('请求动态失败', ToastAndroid.SHORT);
        },
      )
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [loading, upId, dynamicItems]);
  const resetDynamicItems = () => {
    pageInfoRef.current = {
      hasMore: true,
      offset: '',
    };
    setLoading(false);
    setDynamicItems([]);
    setInitLoad(true);
  };
  if (initLoad) {
    setInitLoad(false);
    loadMoreDynamicItems();
    setRefreshHead(refreshHead + 1);
  }
  React.useEffect(() => {
    resetDynamicItems();
  }, [upId]);
  const headerProps = {
    ...route.params,
  };
  if (!headerProps.mid) {
    headerProps.mid = specialUser?.mid;
    headerProps.name = specialUser?.name;
    headerProps.face = specialUser?.face;
  }
  return (
    <View style={styles.container}>
      <Header {...headerProps} />
      <FlatList
        data={dynamicItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReachedThreshold={1}
        refreshing={refreshing}
        style={styles.listStyle}
        ref={dynamicListRef}
        onRefresh={resetDynamicItems}
        onEndReached={loadMoreDynamicItems}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
          </Text>
        }
        ListFooterComponent={
          <Text style={styles.bottomEnd}>
            {dynamicItems.length
              ? pageInfoRef.current.hasMore
                ? '加载中...'
                : '到底了~'
              : ''}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
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
});
