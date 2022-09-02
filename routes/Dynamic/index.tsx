import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ToastAndroid,
  BackHandler,
} from 'react-native';
import { getDynamicItems, TracyId } from '../../services/Bilibili';
import { setLatest } from '../../services/Updates';
import { DynamicItem, DynamicType } from '../../types';
import ForwardItem from './ForwardItem';
import Header from './Header';
import RichTextItem from './RichTextItem';
import VideoItem from './VideoItem';
import { RootStackParamList } from '../../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

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
  const upId = route.params?.upId || TracyId;
  const dynamicListRef = React.useRef<FlatList | null>(null);
  const scrollOffset = React.useRef(0);
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // Prevent default behavior
      // e.preventDefault();
      if (!navigation.isFocused()) {
        return;
      }
      if (dynamicListRef) {
        dynamicListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      }
    });
    return unsubscribe;
  }, [navigation]);
  React.useEffect(() => {
    if (upId) {
      setLatest(upId);
    }
    resetDynamicItems();
  }, [upId]);
  React.useEffect(() => {
    loadMoreDynamicItems();
  }, [upId, pageInfoRef.current]);
  React.useEffect(() => {
    const handler = function () {
      if (navigation.isFocused()) {
        navigation.navigate('Follow');
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', handler);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handler);
    };
  }, [upId, navigation]);
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
  const loadMoreDynamicItems = () => {
    const { offset, hasMore } = pageInfoRef.current;
    if (loading || !hasMore) {
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
  };
  const resetDynamicItems = () => {
    pageInfoRef.current = {
      hasMore: true,
      offset: '',
    };
    setLoading(false);
    setDynamicItems([]);
  };

  return (
    <View style={styles.container}>
      <Header mid={upId} />
      <FlatList
        data={dynamicItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReachedThreshold={1}
        onScroll={e => (scrollOffset.current = e.nativeEvent.contentOffset.y)}
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
            {pageInfoRef.current.hasMore ? '加载中...' : '到底了~'}
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
