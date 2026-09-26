import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import { useDynamicDetail } from "@/api/dynamic-items";
import { useOpusDetail } from "@/api/opus-detail";
import CommentList from "@/components/Comment";
import { DynamicCard } from "@/components/dynamic/dynamic-card";
import { LoginRequired } from "@/components/LoginRequired";
import { Button, Text } from "@/components/styled/rneui";
import UpName from "@/components/UpName";
import { theme } from "@/constants/theme";
import { isLoginRequiredError } from "@/features/bilibili-session/login-required";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
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
  // 动态详情（以及评论）会跟着后台重新校验变化，只有用户下拉时才显示刷新图标
  const pullToRefresh = usePullToRefresh(refresh);

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
        <ActivityIndicator size="large" colorClassName={theme.secondary.accent} />
        <Text className={theme.text.muted}>正在加载动态</Text>
      </View>
    );
  }

  if (!detail.data) {
    if (isLoginRequiredError(detail.error)) {
      return <LoginRequired description="登录后即可查看这条动态" />;
    }
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-lg font-semibold">动态加载失败</Text>
        <Text selectable className={`text-center text-sm ${theme.text.muted}`}>
          动态可能已被删除或不可见，请检查网络后重试
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
        commentCount={detail.data.stats.comment}
        commentType={detail.data.commentType}
        sourceUrl={url}
        refreshing={pullToRefresh.refreshing}
        onRefresh={pullToRefresh.onRefresh}
      >
        <View className="-mx-3 -mt-4">{card}</View>
      </CommentList>
    );
  }

  return (
    <ScrollView
      className={`flex-1 ${theme.background.page}`}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={pullToRefresh.refreshing} onRefresh={pullToRefresh.onRefresh} />
      }
    >
      {card}
      <Text className={`py-8 text-center text-sm ${theme.text.muted}`}>此动态暂无可用评论参数</Text>
    </ScrollView>
  );
}

export default DynamicDetailPage;
