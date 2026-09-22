import { Image, Linking, Pressable, Share, View } from "react-native";
import { Code2, Share2 } from "lucide-react-native";

import { Button, Text } from "@/components/styled/rneui";
import { ThemedIcon } from "@/components/ThemedIcon";

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
            <ThemedIcon icon={Code2} size={20} />
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
            <ThemedIcon icon={Share2} size={20} />
          </Button>
        </View>
      </View>
    </>
  );
}
