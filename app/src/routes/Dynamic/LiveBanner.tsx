import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronRight, Radio } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useLivingInfo } from "@/api/living-info";
import { useUserInfo } from "@/api/user-info";
import { Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";
import { theme } from "@/constants/theme";
import type { NavigationProps, RootStackParamList } from "@/types";

export default function LiveBanner() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, "Dynamic">["route"]>();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const user = route.params?.user;
  const { data: userInfo } = useUserInfo(user?.mid);
  const { livingUrl, roomId } = useLivingInfo(user?.mid);
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const active = Boolean(user && livingUrl && roomId && focused && !reducedMotion);

  useEffect(() => {
    pulse.value = 0;
    if (active) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
    return () => cancelAnimation(pulse);
  }, [active, pulse]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * 0.5,
    transform: [{ scale: 1 + pulse.value * 0.25 }],
  }));

  if (!user || !livingUrl || !roomId) {
    return null;
  }

  const name = userInfo?.name || user.name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="UP正在直播，进入直播间"
      className={`flex-row items-center gap-2 px-4 py-2 ${theme.primary.tint}`}
      onPress={() => {
        navigation.navigate("Living", {
          title: `${name}的直播间`,
          user: { mid: user.mid, name },
          url: livingUrl,
        });
      }}
    >
      <Animated.View style={iconStyle}>
        <ThemedIcon icon={Radio} size={18} colorClassName={theme.primary.text} />
      </Animated.View>
      <Text className={`flex-1 text-sm ${theme.primary.text}`}>UP正在直播</Text>
      <ThemedIcon icon={ChevronRight} size={18} colorClassName={theme.primary.text} />
    </Pressable>
  );
}
