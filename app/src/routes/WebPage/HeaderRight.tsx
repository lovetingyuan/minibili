import { type RouteProp, useRoute } from "@react-navigation/native";
import { ThemedIcon } from "@/components/ThemedIcon";
import * as Clipboard from "expo-clipboard";
import { EllipsisVertical } from "lucide-react-native";
import React from "react";
import { Linking, Share } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  menuTriggerIconButtonStyles,
} from "@/components/Menu";

import type { RootStackParamList } from "../../types";
import { showToast } from "../../utils";

export default HeaderRight;

function HeaderRight(props: { reload: () => void }) {
  const [visible, setVisible] = React.useState(false);
  const route = useRoute<RouteProp<RootStackParamList, "WebPage">>();
  const { url, title } = route.params;
  const hideMenu = () => setVisible(false);

  const showMenu = () => setVisible(true);
  return (
    <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
      <MenuTrigger
        accessibilityRole="button"
        accessibilityLabel="更多操作"
        customStyles={menuTriggerIconButtonStyles}
        onPress={showMenu}
      >
        <ThemedIcon icon={EllipsisVertical} />
      </MenuTrigger>
      <MenuOptions>
        <MenuOption
          text="浏览器打开"
          onSelect={() => {
            hideMenu();
            Linking.openURL(url);
          }}
        />
        <MenuOption
          text="刷新页面"
          onSelect={() => {
            hideMenu();
            props.reload();
          }}
        />
        <MenuOption
          text="复制链接"
          onSelect={() => {
            Clipboard.setStringAsync(url).then(() => {
              showToast(`已复制链接：${url}`);
              hideMenu();
            });
          }}
        />
        <MenuOption
          text="分享页面"
          onSelect={() => {
            hideMenu();
            Share.share({
              message: [title, url].filter(Boolean).join("\n"),
            });
          }}
        />
      </MenuOptions>
    </Menu>
  );
}
