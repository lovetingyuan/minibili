import { Image, Linking, Pressable, Share, View } from "react-native";

import { Button, Icon, Text } from "@/components/styled/rneui";

import { githubLink, site } from "../../constants";

export default Header;

function Header() {
  return (
    <>
      <Pressable
        className="mb-5 mt-1 flex-1 items-center"
        onPress={() => {
          Linking.openURL(site);
        }}
      >
        <Image
          source={require("../../../assets/minibili.png")}
          className="aspect-[33/10] h-auto w-[85%]"
        />
      </Pressable>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="shrink text-lg" numberOfLines={2}>
          一款简单的B站浏览App
        </Text>
        <View className="flex-row items-center gap-2">
          <Button
            radius={"sm"}
            type="clear"
            size="sm"
            onPress={() => {
              Linking.openURL(githubLink);
            }}
          >
            <Icon name="github" type="material-community" size={20} />
          </Button>
          <Button
            radius={"sm"}
            type="clear"
            size="sm"
            onPress={() => {
              Share.share({
                message: `MiniBili - 简单的B站浏览\n点击下载：${site}`,
              });
            }}
          >
            <Icon name="share" type="material-community" size={20} />
          </Button>
        </View>
      </View>
    </>
  );
}
