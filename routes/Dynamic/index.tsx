import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ToastAndroid,
  BackHandler,
  Image,
  // TouchableOpacity,
} from 'react-native';
import { getDynamicItems } from '../../services/Bilibili';
import { DynamicItem, DynamicType } from '../../types';
import ForwardItem from './ForwardItem';
import Header from './Header';
import RichTextItem from './RichTextItem';
import VideoItem from './VideoItem';
import { RootStackParamList } from '../../types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AppContext } from '../../context';
import WordItem from './WordItem';
// import ButtonsOverlay from '../../components/ButtonsOverlay';

type Props = BottomTabScreenProps<RootStackParamList, 'Dynamic'>;

const Dynamic: React.FC<Props> = function Dynamic({ navigation, route }) {
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
  // const [modalVisible, setModalVisible] = React.useState(false);
  // const currentDynamicIdRef = React.useRef('');
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
    if (item.type === DynamicType.Word) {
      Item = WordItem;
    }
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
    // https://m.bilibili.com/dynamic/710533241871794180?spm_id_from=333.999.0.0
    return (
      <View style={styles.itemContainer}>
        {item.top ? (
          <Image
            source={require('../../assets/top.png')}
            style={{ width: 30, height: 15 }}
          />
        ) : null}
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
  const headerProps = route.params || specialUser;
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
          <>
            <Text style={styles.emptyText}>
              哔哩哔哩 (゜-゜)つロ 干杯~-bilibili
            </Text>
            {loading ? (
              <Text style={{ textAlign: 'center' }}>加载中...</Text>
            ) : null}
          </>
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
};

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

export default Dynamic;
