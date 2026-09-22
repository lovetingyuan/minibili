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
import { ThemedIcon } from "@/components/ThemedIcon";
import { showToast } from "@/utils";

export default function HeaderRight(props: { url: string; title: string }) {
  const [visible, setVisible] = React.useState(false);
  function hideMenu() {
    setVisible(false);
  }

  return (
    <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
      <MenuTrigger
        accessibilityRole="button"
        accessibilityLabel="更多操作"
        customStyles={menuTriggerIconButtonStyles}
        onPress={() => setVisible(true)}
      >
        <ThemedIcon icon={EllipsisVertical} />
      </MenuTrigger>
      <MenuOptions>
        <MenuOption
          text="浏览器打开"
          onSelect={() => {
            hideMenu();
            void Linking.openURL(props.url);
          }}
        />
        <MenuOption
          text="复制链接"
          onSelect={() => {
            void Clipboard.setStringAsync(props.url).then(() => {
              showToast(`已复制链接：${props.url}`);
              hideMenu();
            });
          }}
        />
        <MenuOption
          text="分享动态"
          onSelect={() => {
            hideMenu();
            void Share.share({ message: [props.title, props.url].filter(Boolean).join("\n") });
          }}
        />
      </MenuOptions>
    </Menu>
  );
}
