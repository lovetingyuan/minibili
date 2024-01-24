import React from 'react'
import {
  View,
  Linking,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native'
import { Button, Icon, Text } from '@rneui/themed'
import { githubLink } from '../../constants'

export default React.memo(function Header() {
  const { width } = useWindowDimensions()
  return (
    <>
      <Pressable className="mb-5 mt-3 flex-1 items-center">
        <Image
          source={require('../../../assets/minibili.png')}
          className="aspect-[33/10] h-auto"
          style={{ width: width * 0.8 }}
        />
      </Pressable>
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
})
