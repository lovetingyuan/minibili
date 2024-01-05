import { Button, Overlay } from '@rneui/themed'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useStore } from '../store'

export default React.memo(function ButtonsOverlay() {
  const { overlayButtons, setOverlayButtons } = useStore()
  const dismiss = () => {
    setOverlayButtons([])
    // store.overlayButtons = []
  }
  const Buttons = overlayButtons
    .map(button => {
      if (!button) {
        return null
      }
      return (
        <Button
          type="clear"
          buttonStyle={styles.button}
          title={button.text}
          key={button.text}
          onPress={() => {
            button.onPress()
            dismiss()
          }}
        />
      )
    })
    .filter(Boolean)

  if (!Buttons.length) {
    return null
  }
  return (
    <Overlay
      isVisible={overlayButtons.length > 0}
      overlayStyle={styles.overlay}
      onBackdropPress={dismiss}>
      {Buttons}
    </Overlay>
  )
})

const styles = StyleSheet.create({
  button: {
    width: '100%',
    justifyContent: 'flex-start',
    padding: 10,
    paddingHorizontal: 20,
  },
  overlay: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    minWidth: '70%',
  },
})
