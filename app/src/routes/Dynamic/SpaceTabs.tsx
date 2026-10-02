import { Search, X } from 'lucide-react-native'
import { Pressable, TextInput, View } from 'react-native'

import { Button } from '@/components/Button'
import { Text } from '@/components/Text'
import { ThemedIcon } from '@/components/ThemedIcon'
import { theme } from '@/constants/theme'
import useResolvedColor from '@/hooks/useResolvedColor'

import type { SpaceTabsProps } from './SpaceTabs.types'

export default function SpaceTabs(props: SpaceTabsProps) {
  const placeholderColor = useResolvedColor(theme.text.muted)
  const cursorColor = useResolvedColor(theme.primary.accent)

  if (props.mode === 'search') {
    return (
      // key 必须区分两种模式：搜索态与浏览态的 tab 宽度不同（w-14 / flex-1），
      // 复用同一个原生 view 时旧的 width 不会被清掉，会残留成 158/158/0 的 flex base
      <View
        key="search"
        className={`flex-row border-b ${theme.background.surface} ${theme.border.divider}`}
      >
        {(['video', 'dynamic'] as const).map(key => {
          const selected = props.selectedKey === key
          const label = key === 'video' ? '视频' : '动态'
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={`搜索${label}`}
              accessibilityState={{ selected }}
              className="relative w-14 items-center justify-center py-3"
              onPress={() => props.onSelect(key)}
            >
              <Text
                className={`text-sm ${selected ? `${theme.primary.text} font-semibold` : theme.text.muted}`}
              >
                {label}
              </Text>
              {selected ? (
                <View className={`absolute bottom-0 h-0.5 w-8 rounded-full ${theme.primary.bg}`} />
              ) : null}
            </Pressable>
          )
        })}
        <View className="flex-1 justify-center py-1.5">
          <TextInput
            autoFocus
            value={props.query}
            placeholder="搜索该 UP 的内容"
            placeholderTextColor={placeholderColor}
            selectionColor={cursorColor}
            returnKeyType="search"
            accessibilityLabel="搜索该 UP 的内容"
            // 不要用固定高度（h-9），否则文字行高会超出输入框高度、框内文字能上下滚动，这里由内边距撑开
            className={`rounded-lg px-3 py-2 text-sm align-middle ${theme.background.fill.bg} ${theme.text.primary}`}
            onChangeText={props.onChangeQuery}
            onSubmitEditing={props.onSubmit}
          />
        </View>
        <View className="w-12 items-center justify-center">
          <Button
            type="clear"
            radius={18}
            buttonClassName="h-9 w-9 p-0"
            accessibilityRole="button"
            accessibilityLabel="退出搜索"
            onPress={props.onClose}
          >
            <ThemedIcon icon={X} size={20} colorClassName={theme.icon.secondary} />
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View
      key="browse"
      className={`flex-row border-b ${theme.background.surface} ${theme.border.divider}`}
    >
      {props.tabs.map(tab => {
        const selected = props.selectedKey === tab.key
        const label = tab.count === undefined ? tab.label : `${tab.label} ${tab.count}`
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            className="relative flex-1 items-center justify-center py-3"
            onPress={() => props.onSelect(tab.key)}
          >
            <Text
              className={`text-sm ${selected ? `${theme.primary.text} font-semibold` : theme.text.muted}`}
            >
              {label}
            </Text>
            {selected ? (
              <View className={`absolute bottom-0 h-0.5 w-8 rounded-full ${theme.primary.bg}`} />
            ) : null}
          </Pressable>
        )
      })}
      <View className="w-12 items-center justify-center">
        <Button
          type="clear"
          radius={18}
          buttonClassName="h-9 w-9 p-0"
          accessibilityRole="button"
          accessibilityLabel="搜索 UP 内容"
          onPress={props.onOpenSearch}
        >
          <ThemedIcon icon={Search} size={20} colorClassName={theme.icon.secondary} />
        </Button>
      </View>
    </View>
  )
}
