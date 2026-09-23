import { useNavigation } from '@react-navigation/native'
import { ChevronRight, Clock, History, Star } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { ThemedIcon } from '@/components/ThemedIcon'
import { theme } from "@/constants/theme";
import type { MainTabNavigationProp } from '@/types'

export default function LibraryLinks() {
  const navigation = useNavigation<MainTabNavigationProp>()

  return (
    <View className="gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="我的收藏"
        className="flex-row items-center gap-4 rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate('Favorites')}
      >
        <ThemedIcon size={20} icon={Star} colorClassName={theme.primary.accent} />
        <View className="flex-1 items-start justify-center">
          <Text className={`text-base ios:text-[17px] ${theme.text.primary}`}>我的收藏</Text>
        </View>
        <ThemedIcon icon={ChevronRight} size={18} colorClassName={theme.icon.muted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="观看历史"
        className="flex-row items-center gap-4 rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate('History')}
      >
        <ThemedIcon size={20} icon={History} colorClassName={theme.primary.accent} />
        <View className="flex-1 items-start justify-center">
          <Text className={`text-base ios:text-[17px] ${theme.text.primary}`}>观看历史</Text>
        </View>
        <ThemedIcon icon={ChevronRight} size={18} colorClassName={theme.icon.muted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="稍后再看"
        className="flex-row items-center gap-4 rounded-lg bg-transparent px-0 py-3"
        onPress={() => navigation.navigate('WatchLater')}
      >
        <ThemedIcon size={20} icon={Clock} colorClassName={theme.primary.accent} />
        <View className="flex-1 items-start justify-center">
          <Text className={`text-base ios:text-[17px] ${theme.text.primary}`}>稍后再看</Text>
        </View>
        <ThemedIcon icon={ChevronRight} size={18} colorClassName={theme.icon.muted} />
      </Pressable>
    </View>
  )
}
