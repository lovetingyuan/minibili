import { Pressable, View } from "react-native";

import { theme } from "@/constants/theme";
import { Text } from "@/components/styled/rneui";

import type { CommentPaginationFooterProps } from "./comment-pagination-footer.types";

export default function CommentPaginationFooter(props: CommentPaginationFooterProps) {
  return (
    <View className="h-12 items-center justify-center">
      {props.hasItems ? (
        props.isValidating ? (
          <Text className={`text-xs ${theme.text.muted}`}>正在加载...</Text>
        ) : props.error ? (
          <Pressable
            className="h-10 items-center justify-center px-4"
            accessibilityRole="button"
            accessibilityLabel={`加载${props.noun}失败，点击重试`}
            onPress={props.onRetry}
          >
            <Text className={`text-xs ${theme.primary.text}`}>加载失败，点击重试</Text>
          </Pressable>
        ) : (
          <Text className={`text-xs ${theme.text.muted}`}>
            {props.isPageEnd ? `没有更多${props.noun}了` : "上拉加载更多"}
          </Text>
        )
      ) : null}
    </View>
  );
}
