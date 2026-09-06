import React from "react";

import { Button, Icon } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useUpdateNavigationOptions from "@/hooks/useUpdateNavigationOptions";

import type { FollowListHeaderProps } from "./FollowListHeader.types";

export default function useFollowListHeader({
  onSearch,
  searchVisible,
  title,
}: FollowListHeaderProps) {
  useUpdateNavigationOptions({
    headerTitle: title,
    headerRight: searchVisible
      ? undefined
      : () => (
          <Button
            radius="sm"
            type="clear"
            accessibilityLabel="搜索UP主"
            containerClassName="mr-2"
            onPress={onSearch}
          >
            <Icon name="search" colorClassName={colors.gray7.accent} size={24} />
          </Button>
        ),
  });
}
