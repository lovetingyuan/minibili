import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Assets as NavigationAssets } from "@react-navigation/elements";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Asset } from "expo-asset";

import { Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import useRouteTheme from "@/hooks/useRouteTheme";
import { useStore } from "@/store";
import type { MainTabParamList, RootStackParamList } from "@/types";
import { useAppUpdateInfo } from "@/api/check-update";

import About from "./About";
import Dynamic from "./Dynamic";
import DynamicDetail from "./DynamicDetail";
import BilibiliAccountGate from "./Followings/BilibiliAccountGate";
import FavoritesContent from "./Followings/FavoritesContent";
import FollowingDynamicsContent from "./Followings/FollowingDynamicsContent";
import FollowingsContent from "./Followings/FollowingsContent";
import HistoryContent from "./Followings/HistoryContent";
import WatchLaterContent from "./Followings/WatchLaterContent";
import Living from "./Living";
import Play from "./Play";
import SearchVideos from "./SearchVideos";
import VideoList from "./VideoList";
import WebPage from "./WebPage";
import Welcome from "./Welcome";

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
  const activeTintColor = useResolvedColor(colors.primary.text);
  const inactiveTintColor = useResolvedColor(colors.gray6.text);
  const headerTitleColor = useResolvedColor(colors.gray8.text);
  const { hasUpdate } = useAppUpdateInfo();
  const { livingUps, followingDynamicsUpdateCount } = useStore();
  const hasLiveUps = Object.keys(livingUps).length > 0;
  const followingDynamicsBadge =
    followingDynamicsUpdateCount === 0
      ? undefined
      : followingDynamicsUpdateCount >= 99
        ? "99+"
        : followingDynamicsUpdateCount;

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
          title: "热门",
          tabBarIcon: ({ color, size }) => (
            <Icon name="whatshot" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="FollowingDynamics"
        component={FollowingDynamicsRoute}
        options={{
          title: "动态",
          headerTitle: "关注的动态",
          tabBarBadge: followingDynamicsBadge,
          tabBarBadgeStyle: {
            backgroundColor: "#FF6699",
            color: "#FFFFFF",
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: followingDynamicsUpdateCount >= 99 ? 22 : 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -8,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="dynamic-feed" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Followings"
        component={FollowingsRoute}
        options={{
          title: "关注",
          tabBarBadge: hasLiveUps ? "𝘭𝘪𝘷𝘦" : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#00AEEC",
            color: "#FFFFFF",
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -8,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="people-outline" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Mine"
        component={About}
        options={{
          title: "我的",
          tabBarBadge: hasUpdate ? "新" : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF6699",
            color: "#FFFFFF",
            fontSize: 8,
            lineHeight: 14,
            height: 14,
            minWidth: 14,
            paddingHorizontal: 3,
            borderRadius: 7,
            end: -6,
            top: 1,
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" type="material" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppRoute() {
  const routeTheme = useRouteTheme();
  const { $firstRun, initialed } = useStore();
  const isFirstRun = $firstRun === -1;
  const headerTitleColor = useResolvedColor(colors.gray8.text);

  if (!initialed) {
    return null;
  }

  return (
    <NavigationContainer theme={routeTheme}>
      <Stack.Navigator
        initialRouteName={isFirstRun ? "Welcome" : "MainTabs"}
        screenOptions={{
          headerTransparent: false,
          headerTitleStyle: {
            fontSize: 18,
            color: headerTitleColor,
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{ headerTitle: "欢迎使用 MiniBili" }}
        />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="SearchVideos"
          component={SearchVideos}
          options={{ headerTitle: "搜索视频" }}
        />
        <Stack.Screen name="Dynamic" component={Dynamic} options={{ headerTitle: "动态" }} />
        <Stack.Screen name="Play" component={Play} />
        <Stack.Screen name="Living" component={Living} />
        <Stack.Screen
          name="DynamicDetail"
          component={DynamicDetail}
          options={{ headerTitle: "动态详情" }}
        />
        <Stack.Screen
          name="WebPage"
          component={WebPage}
          options={({ route }) => ({ headerTitle: route.params.title || "-" })}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesRoute}
          options={{ headerTitle: "我的收藏" }}
        />
        <Stack.Screen
          name="History"
          component={HistoryRoute}
          options={{ headerTitle: "观看历史" }}
        />
        <Stack.Screen
          name="WatchLater"
          component={WatchLaterRoute}
          options={{ headerTitle: "稍后再看" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppRoute;
