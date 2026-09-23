import { useUserSettings } from "@/features/user-data/useUserSettings";
import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

export default function SettingsSync() {
  const { error } = useUserSettings();
  if (!error) {
    return null;
  }

  return (
    <Text className={`text-sm ${theme.error.text}`} accessibilityRole="alert">
      设置同步失败：{error.message}
    </Text>
  );
}
