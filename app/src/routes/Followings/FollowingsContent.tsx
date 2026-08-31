import { ActivityIndicator, View } from "react-native";

import { Button, Text } from "@/components/styled/rneui";
import { useFollowingsState } from "@/features/bilibili-followings/useFollowingsState";
import FollowList from "./FollowList";

export default function FollowingsContent() {
  const { isReady, error, isValidating, mutate } = useFollowingsState();
  function retry() {
    void mutate().catch(() => {});
  }
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {error ? (
          <>
            <Text className="text-center">B站关注列表同步失败，尚未显示旧的本地记录</Text>
            <Button title="重新同步" loading={isValidating} onPress={retry} />
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text>正在同步 B站关注列表</Text>
          </>
        )}
      </View>
    );
  }
  return (
    <View className="flex-1">
      {error ? (
        <View className="flex-row items-center justify-center gap-2 px-3 py-2">
          <Text className="shrink text-xs">同步失败，正在显示上次数据</Text>
          <Button title="重试" type="clear" size="sm" loading={isValidating} onPress={retry} />
        </View>
      ) : null}
      <FollowList />
    </View>
  );
}
