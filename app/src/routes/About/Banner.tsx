import { Linking, Pressable, Share, View } from 'react-native'
import { Share2 } from 'lucide-react-native'

import { GitHubIcon } from '@/components/GitHubIcon'
import { Button } from '@/components/Button'
import { Image } from '@/components/Image'
import { Text } from '@/components/Text'
import { ThemedIcon } from '@/components/ThemedIcon'

import { githubLink, site } from '../../constants'

export default Header

function Header() {
  return (
    <View className="mb-4 mt-1 flex-row items-center gap-3">
      <Pressable
        className="shrink-0"
        onPress={() => {
          Linking.openURL(site)
        }}
      >
        <Image
          source={require('../../../assets/minibili.png')}
          className="size-24"
          contentFit="contain"
        />
      </Pressable>
      <View className="flex-1 flex-row items-center gap-2">
        <Text className="flex-1 text-xl" numberOfLines={2}>
          {'一款简单的\nB站浏览App'}
        </Text>
        <View className="shrink-0 flex-row items-center gap-1">
          <Button
            radius={'sm'}
            type="clear"
            size="sm"
            onPress={() => {
              Linking.openURL(githubLink)
            }}
          >
            <GitHubIcon />
          </Button>
          <Button
            radius={'sm'}
            type="clear"
            size="sm"
            onPress={() => {
              Share.share({
                message: `MiniBili - 简单的B站浏览\n点击下载：${site}`,
              })
            }}
          >
            <ThemedIcon icon={Share2} size={20} />
          </Button>
        </View>
      </View>
    </View>
  )
}
