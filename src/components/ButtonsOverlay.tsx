import { Button, Overlay } from '@rneui/themed'
import React from 'react'

import { useStore } from '../store'

export default React.memo(function ButtonsOverlay() {
  const { overlayButtons, setOverlayButtons } = useStore()
  const dismiss = () => {
    setOverlayButtons([])
  }
  const Buttons = overlayButtons
    .map(button => {
      if (!button) {
        return null
      }
      return (
        <Button
          type="clear"
          buttonStyle={tw('w-full justify-start py-2.5 px-5')}
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
      overlayStyle={tw('px-0 py-3 min-w-[70%]')}
      onBackdropPress={dismiss}>
      {Buttons}
    </Overlay>
  )
})
