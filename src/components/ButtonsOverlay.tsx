import { Button, Overlay } from '@rneui/themed'
import React from 'react'
import { useWindowDimensions } from 'react-native'

export default function ButtonsOverlay(props: {
  visible: boolean
  buttons: ({
    text: string
    name: string
    longPress?: boolean
  } | null)[]
  onPress: (name: string) => void
  overlayStyle?: any
  buttonStyle?: any
  dismiss: () => void
}) {
  const Buttons = props.buttons
    .map(button => {
      if (!button) {
        return null
      }
      return (
        <Button
          type="clear"
          containerStyle={{ alignItems: 'flex-start', paddingHorizontal: 12 }}
          title={button.text}
          key={button.name}
          {...(button.longPress
            ? {
                onLongPress: () => {
                  props.onPress(button.name)
                  props.dismiss()
                },
              }
            : {
                onPress: () => {
                  props.onPress(button.name)
                  props.dismiss()
                },
              })}
        />
      )
    })
    .filter(Boolean)

  const { width } = useWindowDimensions()
  if (!Buttons.length) {
    return null
  }
  return (
    <Overlay
      isVisible={props.visible}
      overlayStyle={{
        paddingHorizontal: 0,
        paddingVertical: 12,
        minWidth: width * 0.8,
      }}
      onBackdropPress={props.dismiss}>
      {Buttons}
    </Overlay>
  )
}
