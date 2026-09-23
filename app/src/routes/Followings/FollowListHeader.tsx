import { useNavigation } from "@react-navigation/native";
import { Search } from "lucide-react-native";
import { View } from "react-native";

import { Button } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import type { MainTabNavigationProp } from "@/types";

import type { FollowListHeaderProps } from "./FollowListHeader.types";

/** 关注页头部的搜索入口：点击进入独立的 UP 搜索路由 */
function SearchUpButton() {
  const navigation = useNavigation<MainTabNavigationProp>();
  return (
    <View className="mr-2">
      <Button
        radius="sm"
        size="sm"
        type="clear"
        accessibilityLabel="搜索UP主"
        onPress={() => {
          navigation.navigate("SearchUps");
        }}
      >
        <ThemedIcon icon={Search} colorClassName={theme.icon.secondary} size={24} />
      </Button>
    </View>
  );
}

// headerRight 会被导航库当普通函数直接调用，这里只返回元素，
// 让 useNavigation 等 hook 落在 SearchUpButton 组件内部。
const renderSearchUpButton = () => <SearchUpButton />;

export default function useFollowListHeader({ title }: FollowListHeaderProps) {
  useUpdateNavigationOptions({
    headerTitle: title,
    headerRight: renderSearchUpButton,
  });
}
