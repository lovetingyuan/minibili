import { Button, Overlay } from '@rneui/themed'
import React from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'

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
  const { width } = useWindowDimensions()
  const Buttons = props.buttons
    .map(button => {
      if (!button) {
        return null
      }
      return (
        <Button
          type="clear"
          buttonStyle={styles.button}
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

  if (!Buttons.length) {
    return null
  }
  return (
    <Overlay
      isVisible={props.visible}
      overlayStyle={{
        paddingHorizontal: 0,
        paddingVertical: 12,
        minWidth: width * 0.6,
      }}
      onBackdropPress={props.dismiss}>
      {Buttons}
    </Overlay>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    justifyContent: 'flex-start',
    padding: 10,
    paddingHorizontal: 20,
  },
})
