import { Chip } from "@/components/Chip";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Text } from "@/components/styled/rneui";
import React from "react";
import { View } from "react-native";
import { colors } from "@/constants/colors.tw";
import { useUserSettings } from "@/features/user-data/useUserSettings";
import type { UserSettings } from "@/features/user-data/types";
import type { CategorySelection } from "./SortCate.types";

export default function SortCate() {
  const [expanded, setExpanded] = React.useState(false);
  const {
    values: { $videoCatesList },
    scope,
    generation,
    setSetting,
  } = useUserSettings();
  const [selection, setSelection] = React.useState<CategorySelection>({ stamp: "", rids: [] });
  const stampFor = (list: UserSettings["$videoCatesList"]) =>
    `${scope}:${generation}:${list.map((item) => item.rid).join(",")}`;
  // 远端重新排序或切换账号后，以最新设置派生列表，不保留旧账号的编辑草稿。
  const selected = selection.stamp === stampFor($videoCatesList) ? selection.rids : [];
  const categories = $videoCatesList.slice(1);
  const selectedIds = new Set(selected);
  const sorted = categories.filter((item) => selectedIds.has(item.rid));
  const unsorted = categories.filter((item) => !selectedIds.has(item.rid));

  function move(rid: number, select: boolean) {
    const item = categories.find((category) => category.rid === rid);
    if (!item) {
      return;
    }
    const nextSelected = select ? [...selected, rid] : selected.filter((id) => id !== rid);
    const nextSorted = select ? [...sorted, item] : sorted.filter((entry) => entry.rid !== rid);
    const nextUnsorted = select
      ? unsorted.filter((entry) => entry.rid !== rid)
      : [...unsorted, item];
    const next = [$videoCatesList[0], ...nextSorted, ...nextUnsorted];
    if (setSetting("$videoCatesList", next)) {
      setSelection({ stamp: stampFor(next), rids: nextSelected });
    }
  }
  return (
    <CollapsibleSection
      expanded={expanded}
      title="调整分区顺序"
      onPress={() => setExpanded(!expanded)}
    >
      <View className="flex-row flex-wrap items-center bg-transparent px-1">
        <View className="w-full flex-1 flex-row flex-wrap gap-x-3 border-b-[0.5px] border-b-gray-400">
          {sorted.map((category) => (
            <Chip
              key={category.rid}
              title={category.label}
              type="outline"
              onPress={() => move(category.rid, false)}
              containerClassName="mb-2"
              buttonClassName="px-[6px] py-[2px]"
            />
          ))}
          {!sorted.length && (
            <Text className={`mb-1 flex-1 ${colors.gray6.text}`}>点击名称调整顺序</Text>
          )}
        </View>
        <View className="mt-5 flex-row flex-wrap gap-x-3">
          {unsorted.map((category) => (
            <Chip
              key={category.rid}
              title={category.label}
              type="outline"
              onPress={() => move(category.rid, true)}
              containerClassName="mb-2"
              buttonClassName="px-2 py-[2px]"
            />
          ))}
        </View>
      </View>
    </CollapsibleSection>
  );
}
