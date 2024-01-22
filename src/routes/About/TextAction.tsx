import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Text } from '@rneui/themed'
// import { s } from '../../styles'

export default React.memo(function TextAction(
  props: React.PropsWithChildren<{
    text: string
    onTextPress?: () => void
    buttons: { text: string; loading?: boolean; onPress: () => void }[]
  }>,
) {
  return (
    <View style={styles.infoItem}>
      <Text className="text-base text-lime-500" onPress={props.onTextPress}>
        {props.text}
      </Text>
      <View style={styles.btns}>
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

const styles = StyleSheet.create({
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  btns: { flexDirection: 'row' },
})
