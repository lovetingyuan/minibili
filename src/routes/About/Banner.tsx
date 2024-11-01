import { Button, Icon, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, Pressable, View } from 'react-native'

import { githubLink, site } from '../../constants'

export default React.memo(Header)

function Header() {
  return (
    <>
      <Pressable
        className="mb-5 mt-1 flex-1 items-center"
        onPress={() => {
          Linking.openURL(site)
        }}>
        <Image
          source={require('../../../assets/minibili.png')}
          className="aspect-[33/10] h-auto w-[85%]"
        />
      </Pressable>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="shrink text-2xl" numberOfLines={2}>
          一款简单的B站浏览App
        </Text>
        <Button
          radius={'sm'}
          type="clear"
          size="sm"
          containerStyle={tw('self-start')}
          onPress={() => {
            Linking.openURL(githubLink)
          }}>
          <Icon name="github" type="material-community" size={20} />
        </Button>
      </View>
    </>
  )
}
