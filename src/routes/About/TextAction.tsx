import { Button, Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

export default React.memo(function TextAction(
  props: React.PropsWithChildren<{
    text: string
    onTextPress?: () => void
    buttons: { text: string; loading?: boolean; onPress: () => void }[]
  }>,
) {
  return (
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-base" onPress={props.onTextPress}>
        {props.text}
      </Text>
      <View className="flex-row">
        {props.buttons.map(button => {
          return (
            <Button
              type="clear"
              size="sm"
              key={button.text}
              loading={!!button.loading}
              onPress={() => {
                button.onPress()
              }}>
              {button.text}
            </Button>
          )
        })}
      </View>
      {props.children}
    </View>
  )
})
