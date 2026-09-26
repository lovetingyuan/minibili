import type { CompositeNavigationProp, NavigatorScreenParams } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

// import { VideoInfo } from './api/video-info'
// import { getInitVideoInfoValue } from './store/play'

export type PromiseResult<T extends Promise<any>> = T extends Promise<infer R> ? R : never;

export interface UpInfo {
  mid: number | string;
  name: string;
  face: string;
  sign: string;
}

export interface VideoListItemInfo {
  bvid: string;
  name: string;
  title: string;
  cover: string;
  date?: string | number;
  duration: string | number;
  mid: string | number;
  // ---
  desc?: string;
  tag?: string;
  face?: string;
  aid?: number | string;
  danmaku?: number;
  play?: number;
  like?: number;
}

/** 长按菜单（ButtonsOverlay）里的一个按钮 */
export type OverlayButton = {
  text: string;
  onPress: () => void;
  /** 文案前的图标；不传则只显示文案 */
  icon?: LucideIcon;
  /** 图标是否用实心填充，用于「已点赞」这类选中态 */
  filled?: boolean;
};

export type MainTabParamList = {
  Hot: undefined;
  FollowingDynamics: undefined;
  Followings: undefined;
  Mine: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SearchVideos: undefined;
  SearchUps: undefined;
  WebPage: { url: string; title?: string; type?: "pc" | "mobile" };
  Play: {
    bvid: string;
    title: string;
    cid?: number;
    aid?: string | number;
    mid?: string | number;
    name?: string;
    face?: string;
    cover?: string;
    desc?: string;
    date?: number | string;
    tag?: string;
  };
  Dynamic?: {
    from?: string;
    user: UpInfo;
  };
  DynamicDetail: {
    dynamicId: string;
    title: string;
    user?: Pick<UpInfo, "mid" | "name">;
  };
  Favorites: undefined;
  History: undefined;
  WatchLater: undefined;
  BilibiliLogin: undefined;
  Living: { url: string; title: string; user?: Pick<UpInfo, "mid" | "name"> };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  RootNavigationProp
>;

export type NavigationProps = NativeStackScreenProps<RootStackParamList>;
