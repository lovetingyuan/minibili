import { Button, Icon, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, View } from 'react-native'

import { githubLink } from '../../constants'

export default React.memo(Header)

function Header() {
  return (
    <>
      <View className="mb-4 flex-1 items-center">
        <Image
          source={require('../../../assets/minibili.png')}
          className="aspect-[33/10] h-auto w-[85%]"
        />
      </View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-2xl shrink" numberOfLines={2}>
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
