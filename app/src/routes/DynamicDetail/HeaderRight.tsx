import { type RouteProp, useRoute } from "@react-navigation/native";
import { Icon } from "@/components/styled/rneui";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { Linking, Share } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "@/components/Menu";

import { useStore } from "../../store";
import type { RootStackParamList } from "../../types";
import { showToast } from "../../utils";

export default HeaderRight;

function HeaderRight(props: { reload: () => void }) {
  const { webViewMode, setWebViewMode } = useStore();
  const [visible, setVisible] = React.useState(false);
  const route = useRoute<RouteProp<RootStackParamList, "WebPage">>();
  const { url, title } = route.params;
  const hideMenu = () => setVisible(false);

  const showMenu = () => setVisible(true);
  return (
    // <View className="flex-row items-center gap-3">
    <Menu opened={visible} onBackdropPress={hideMenu} onClose={hideMenu}>
      <MenuTrigger onPress={showMenu}>
        <Icon name="dots-vertical" type="material-community" />
      </MenuTrigger>
      <MenuOptions>
        <MenuOption
          text={webViewMode === "MOBILE" ? "电脑模式" : "手机模式"}
          onSelect={() => {
            setWebViewMode(webViewMode === "MOBILE" ? "PC" : "MOBILE");
            hideMenu();
          }}
        />
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
    // </View>
  );
}
