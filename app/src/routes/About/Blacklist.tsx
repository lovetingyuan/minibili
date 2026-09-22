import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useBilibiliBlacklist } from "@/api/useBilibiliBlacklist";
import { Chip } from "@/components/Chip";
import { Icon, ListItem, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";

export default function Blacklist() {
  const [expanded, setExpanded] = React.useState(false);
  const { blacklist, account, isPreparing, data, error } = useBilibiliBlacklist();
  const loading = isPreparing || Boolean(account && data === undefined && !error);

  return (
    <ListItem.Accordion
      icon={<Icon name="chevron-down" type="material-community" />}
      containerClassName="p-0 mt-1 mb-3 bg-transparent"
      content={
        <ListItem.Content>
          <ListItem.Title>
            黑名单{account && data !== undefined ? `（${blacklist.size}）` : ""}
          </ListItem.Title>
        </ListItem.Content>
      }
      isExpanded={expanded}
      onPress={() => setExpanded(!expanded)}
    >
      {expanded ? (
        <View className="gap-3 px-1 pb-4">
          {loading ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator accessibilityLabel="正在加载黑名单" />
              <Text className={`text-sm ${colors.gray6.text}`}>黑名单加载中</Text>
            </View>
          ) : !account ? (
            <Text className={`text-sm ${colors.gray6.text}`}>登录 B站后查看黑名单</Text>
          ) : (
            <>
              <View className="flex-row flex-wrap">
                {Array.from(blacklist.values()).map((up) => (
                  <Chip
                    key={up.mid}
                    title={up.name}
                    type="outline"
                    accessibilityRole="text"
                    titleClassName="text-left text-sm font-normal"
                    containerClassName="mb-2 mr-2 max-w-full self-start"
                    buttonClassName="px-2 py-[2px]"
                  />
                ))}
              </View>
              {error ? (
                <Text className={`text-sm ${colors.error.text}`}>黑名单加载失败</Text>
              ) : null}
              {!error && blacklist.size === 0 ? (
                <Text className={`py-2 text-sm ${colors.gray6.text}`}>暂无黑名单用户</Text>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </ListItem.Accordion>
  );
}
