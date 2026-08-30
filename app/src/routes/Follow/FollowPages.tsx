import React from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { useResolveClassNames } from "uniwind";

import { Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import FavoritesContent from "./FavoritesContent";
import FollowingsContent from "./FollowingsContent";

const titles = ["UP主", "我的收藏"];

export default function FollowPages() {
  // 旧开发包/OTA 安装包可能尚未编入新增的原生依赖，不能挂载缺失的 ViewManager。
  const nativePagerAvailable = UIManager.hasViewManagerConfig("RNCViewPager");
  const pager = React.useRef<PagerView>(null);
  const scrollPager = React.useRef<ScrollView>(null);
  const currentPage = React.useRef(0);
  const [page, setPage] = React.useState(0);
  const [favoritesVisited, setFavoritesVisited] = React.useState(false);
  const { width } = useWindowDimensions();
  const [pageWidth, setPageWidth] = React.useState(width);
  const pagerStyle = useResolveClassNames("flex-1");

  React.useEffect(() => {
    if (!nativePagerAvailable) {
      scrollPager.current?.scrollTo({ x: currentPage.current * pageWidth, animated: false });
    }
  }, [nativePagerAvailable, pageWidth]);

  function updatePage(index: number) {
    Keyboard.dismiss();
    currentPage.current = index;
    setPage(index);
    if (index === 1) {
      setFavoritesVisited(true);
    }
  }

  function selectPage(index: number) {
    updatePage(index);
    if (nativePagerAvailable) {
      pager.current?.setPage(index);
    } else {
      scrollPager.current?.scrollTo({ x: index * pageWidth, animated: true });
    }
  }

  const pages = [
    <View
      key="followings"
      collapsable={false}
      className="h-full w-full"
      style={nativePagerAvailable ? undefined : { width: pageWidth }}
    >
      <FollowingsContent />
    </View>,
    <View
      key="favorites"
      collapsable={false}
      className="h-full w-full"
      style={nativePagerAvailable ? undefined : { width: pageWidth }}
    >
      {favoritesVisited ? <FavoritesContent /> : null}
    </View>,
  ];

  return (
    <View className="flex-1">
      <View className={`flex-row border-b px-3 ${colors.gray2.border}`}>
        {titles.map((title, index) => (
          <Pressable
            key={title}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === index }}
            accessibilityLabel={title}
            onPress={() => selectPage(index)}
            className="flex-1 items-center px-4 pt-3"
          >
            <Text
              className={`text-base ${page === index ? `${colors.primary.text} font-bold` : colors.gray6.text}`}
            >
              {title}
            </Text>
            <View
              className={`mt-2 h-0.5 w-8 rounded-full ${page === index ? colors.primary.bg : "bg-transparent"}`}
            />
          </Pressable>
        ))}
      </View>
      {nativePagerAvailable ? (
        <PagerView
          ref={pager}
          style={pagerStyle}
          initialPage={0}
          offscreenPageLimit={1}
          onPageSelected={({ nativeEvent }) => updatePage(nativeEvent.position)}
        >
          {pages}
        </PagerView>
      ) : (
        <View
          className="flex-1"
          onLayout={({ nativeEvent }) => {
            if (nativeEvent.layout.width > 0) {
              setPageWidth(nativeEvent.layout.width);
            }
          }}
        >
          <ScrollView
            ref={scrollPager}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            className="flex-1"
            contentContainerClassName="h-full"
            onMomentumScrollEnd={({ nativeEvent }) => {
              const measuredWidth = nativeEvent.layoutMeasurement.width;
              if (measuredWidth > 0) {
                const nextPage = Math.round(nativeEvent.contentOffset.x / measuredWidth);
                updatePage(Math.max(0, Math.min(titles.length - 1, nextPage)));
              }
            }}
          >
            {pages}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
