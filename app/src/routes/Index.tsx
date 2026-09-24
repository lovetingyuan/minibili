import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Assets as NavigationAssets } from '@react-navigation/elements';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Asset } from 'expo-asset';
import { Flame, GalleryVerticalEnd, UserRound, UsersRound } from 'lucide-react-native';

import { ThemedIcon } from '@/components/ThemedIcon';
import useResolvedColor from '@/hooks/useResolvedColor';
import useResolvedStyle from '@/hooks/useResolvedStyle';
import useRouteTheme from '@/hooks/useRouteTheme';
import useTheme from '@/hooks/useTheme';
import { useStore } from '@/store';
import { useUnreadFollowedUpCount } from '@/store/derives';
import type { MainTabParamList, RootStackParamList } from '@/types';
import { useAppUpdateInfo } from '@/api/check-update';

import About from './About';
import BilibiliLogin from './BilibiliLogin';
import Dynamic from './Dynamic';
import DynamicDetail from './DynamicDetail';
import BilibiliAccountGate from './Followings/BilibiliAccountGate';
import FavoritesContent from './Followings/FavoritesContent';
import { headerRight as favoritesHeaderRight } from './Followings/FavoritesHeader';
import FollowingDynamicsContent from './Followings/FollowingDynamicsContent';
import FollowingsContent from './Followings/FollowingsContent';
import HistoryContent from './Followings/HistoryContent';
import WatchLaterContent from './Followings/WatchLaterContent';
import Living from './Living';
import Play from './Play';
import SearchUps from './SearchUps';
import SearchVideos from './SearchVideos';
import VideoList from './VideoList';
import WebPage from './WebPage';
import Welcome from './Welcome';
import { flushPendingBilibiliLogin, rootNavigationRef } from './navigation';

Asset.loadAsync([...NavigationAssets]);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export function FollowingDynamicsRoute() {
  return <BilibiliAccountGate Content={FollowingDynamicsContent} syncFollowings />;
}

export function FollowingsRoute() {
  return <BilibiliAccountGate Content={FollowingsContent} syncFollowings />;
}

function FavoritesRoute() {
  return <BilibiliAccountGate Content={FavoritesContent} />;
}

function HistoryRoute() {
  return <BilibiliAccountGate Content={HistoryContent} />;
}

function WatchLaterRoute() {
  return <BilibiliAccountGate Content={WatchLaterContent} />;
}

export function MainTabs() {
  const theme = useTheme();
  const activeTintColor = useResolvedColor(theme.primary.text);
  const inactiveTintColor = useResolvedColor(theme.text.muted);
  const headerTitleColor = useResolvedColor(theme.text.primary);
  // 角标是纯色底：直接取主题里的品牌底色，直播角标固定用主色蓝
  const badgeColor = useResolvedStyle(theme.secondary.bg).backgroundColor;
  const liveBadgeColor = useResolvedStyle(theme.primary.bg).backgroundColor;
  const { hasUpdate } = useAppUpdateInfo();
  const { livingUps, followingDynamicsUpdateCount } = useStore();
  const unreadFollowedUpCount = useUnreadFollowedUpCount();
  const hasLiveUps = Object.keys(livingUps).length > 0;
  const followingDynamicsBadge =
    followingDynamicsUpdateCount === 0
      ? undefined
      : followingDynamicsUpdateCount >= 99
        ? '99+'
        : followingDynamicsUpdateCount;
  const followingsUnreadBadge =
    unreadFollowedUpCount === 0 ? undefined : unreadFollowedUpCount >= 99 ? '99+' : unreadFollowedUpCount;

  return (
    <Tab.Navigator
      initialRouteName="Hot"
      screenOptions={{
        headerTitleStyle: {
          fontSize: 18,
          color: headerTitleColor,
        },
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
      }}
    >
      <Tab.Screen
        name="Hot"
        component={VideoList}
        options={{
          title: '热门',
          tabBarIcon: ({ color, size }) => <ThemedIcon icon={Flame} color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="FollowingDynamics"
        component={FollowingDynamicsRoute}
        options={{
          title: '动态',
          headerTitle: '关注的动态',
          tabBarBadge: followingDynamicsBadge,
          tabBarBadgeStyle: {
            backgroundColor: badgeColor,
            color: '#FFFFFF',
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: followingDynamicsUpdateCount >= 99 ? 22 : 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -8,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => <ThemedIcon icon={GalleryVerticalEnd} color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Followings"
        component={FollowingsRoute}
        options={{
          title: '我的关注',
          // 有直播 UP 时优先展示直播角标，否则展示有未读更新的 UP 数量
          tabBarBadge: hasLiveUps ? '𝘭𝘪𝘷𝘦' : followingsUnreadBadge,
          tabBarBadgeStyle: {
            backgroundColor: hasLiveUps ? liveBadgeColor : badgeColor,
            color: '#FFFFFF',
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: !hasLiveUps && unreadFollowedUpCount >= 99 ? 22 : 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -8,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => <ThemedIcon icon={UsersRound} color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Mine"
        component={About}
        options={{
          title: '我的',
          tabBarBadge: hasUpdate ? '新' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: badgeColor,
            color: '#FFFFFF',
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -6,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => <ThemedIcon icon={UserRound} color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppRoute() {
  const theme = useTheme();
  const routeTheme = useRouteTheme();
  const { $firstRun, initialed } = useStore();
  const isFirstRun = $firstRun === -1;
  const headerTitleColor = useResolvedColor(theme.text.primary);

  if (!initialed) {
    return null;
  }

  return (
    <NavigationContainer ref={rootNavigationRef} theme={routeTheme} onReady={flushPendingBilibiliLogin}>
      <Stack.Navigator
        initialRouteName={isFirstRun ? 'Welcome' : 'MainTabs'}
        screenOptions={{
          headerTransparent: false,
          headerTitleStyle: {
            fontSize: 18,
            color: headerTitleColor,
          },
        }}
      >
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerTitle: '欢迎使用 MiniBili' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="SearchVideos" component={SearchVideos} options={{ headerTitle: '搜索视频' }} />
        <Stack.Screen name="SearchUps" component={SearchUps} options={{ headerTitle: '搜索UP主' }} />
        <Stack.Screen name="Dynamic" component={Dynamic} options={{ headerTitle: '动态' }} />
        <Stack.Screen name="Play" component={Play} />
        <Stack.Screen name="Living" component={Living} />
        <Stack.Screen name="DynamicDetail" component={DynamicDetail} options={{ headerTitle: '动态详情' }} />
        <Stack.Screen
          name="WebPage"
          component={WebPage}
          options={({ route }) => ({ headerTitle: route.params.title || '-' })}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesRoute}
          options={{ headerTitle: '我的收藏', headerRight: favoritesHeaderRight }}
        />
        <Stack.Screen name="History" component={HistoryRoute} options={{ headerTitle: '观看历史' }} />
        <Stack.Screen name="WatchLater" component={WatchLaterRoute} options={{ headerTitle: '稍后再看' }} />
        <Stack.Screen name="BilibiliLogin" component={BilibiliLogin} options={{ headerTitle: '登录 B站' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppRoute;
