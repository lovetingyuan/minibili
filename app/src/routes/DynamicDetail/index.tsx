import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import { useDynamicDetail } from "@/api/dynamic-items";
import { useOpusDetail } from "@/api/opus-detail";
import CommentList from "@/components/CommentList";
import { DynamicCard } from "@/components/dynamic/dynamic-card";
import { Button, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { colors } from "@/constants/colors.tw";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";
import type { RootStackParamList } from "@/types";

import HeaderRight from "./HeaderRight";

type Props = NativeStackScreenProps<RootStackParamList, "DynamicDetail">;

function DynamicDetailPage({ route }: Props) {
  const { dynamicId, title, user } = route.params;
  const detail = useDynamicDetail(dynamicId);
  // 专栏文章的折叠摘要拿不到正文全文，只有专栏才额外请求 opus 详情
  const isArticle = detail.data?.content.kind === "article";
  const article = useOpusDetail(isArticle ? dynamicId : null);
  const url = `https://www.bilibili.com/opus/${dynamicId}`;

  async function refresh() {
    await detail.mutate();
    if (isArticle) {
      await article.mutate();
    }
  }

  useUpdateNavigationOptions({
    headerRight: () => <HeaderRight url={url} title={title} />,
    headerTitle: () => (
      <Text className="text-lg font-semibold" numberOfLines={1}>
        <UpName mid={user?.mid} className="text-lg font-semibold">
          {user?.name || title}
        </UpName>
        {user ? "的动态" : ""}
      </Text>
    ),
  });

  if (detail.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator size="large" colorClassName={colors.secondary.accent} />
        <Text className={colors.gray6.text}>正在加载动态</Text>
      </View>
    );
  }

  if (!detail.data) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-lg font-semibold">动态加载失败</Text>
        <Text selectable className={`text-center text-sm ${colors.gray6.text}`}>
          {detail.error?.message || "动态可能已被删除或不可见"}
        </Text>
        <Button title="重新加载" type="outline" onPress={refresh} />
      </View>
    );
  }

  const card = (
    <DynamicCard
      item={detail.data}
      detail
      article={isArticle ? (article.data ?? undefined) : undefined}
      articleLoading={isArticle && article.isLoading}
    />
  );
  if (detail.data.commentId && detail.data.commentId !== "0" && detail.data.commentType > 0) {
    return (
      <CommentList
        commentId={detail.data.commentId}
        commentType={detail.data.commentType}
        sourceUrl={url}
        refreshing={detail.isValidating}
        onRefresh={refresh}
      >
        <View className="-mx-3 -mt-4">{card}</View>
      </CommentList>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-100 dark:bg-black"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={detail.isValidating} onRefresh={refresh} />}
    >
      {card}
      <Text className={`py-8 text-center text-sm ${colors.gray6.text}`}>
        此动态暂无可用评论参数
      </Text>
    </ScrollView>
  );
}

export default DynamicDetailPage;
