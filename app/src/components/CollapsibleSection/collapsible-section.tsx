import { ChevronDown } from 'lucide-react-native'
import React from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import type { CollapsibleSectionProps } from './collapsible-section.types'

import { ThemedIcon } from '@/components/ThemedIcon'
import { colors } from '@/constants/colors.tw'

export function CollapsibleSection({
  children,
  expanded,
  onPress,
  title,
}: CollapsibleSectionProps) {
  const transition = useSharedValue(Number(expanded))

  React.useEffect(() => {
    // Reanimated shared values use intentional mutation to update UI-thread animation state.
    // oxlint-disable-next-line react/immutability
    transition.value = withTiming(Number(expanded), {
      duration: 350,
    })
  }, [expanded, transition])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${transition.value * -180}deg` }],
  }))

  return (
    <Animated.View layout={LinearTransition.duration(350)} style={{ overflow: 'hidden' }}>
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="mb-3 mt-1 flex-row items-center gap-4 bg-transparent p-0"
        onPress={onPress}
      >
        <View className="flex-1 items-start justify-center">
          <Text className={`text-base ios:text-[17px] ${colors.black.text}`}>{title}</Text>
        </View>
        <Animated.View style={iconStyle}>
          <ThemedIcon size={18} icon={ChevronDown} colorClassName={colors.gray6.accent} />
        </Animated.View>
      </Pressable>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(350)} exiting={FadeOut.duration(350)}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}
