import { Button, Overlay } from '@rneui/themed'
import React from 'react'

import { colors } from '@/constants/colors.tw'

import { useStore } from '../store'
import Modal2 from './Modal2'

function ButtonsOverlay() {
  const { overlayButtons, setOverlayButtons } = useStore()
  const dismiss = () => {
    setOverlayButtons([])
  }
  const Buttons = overlayButtons
    .map((button) => {
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
            dismiss()
            button.onPress()
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
      ModalComponent={Modal2}
      overlayStyle={tw(`px-0 py-3 min-w-[70%] max-w-[90%] ${colors.gray2.bg}`)}
      onBackdropPress={dismiss}>
      {Buttons}
    </Overlay>
  )
}

export default React.memo(ButtonsOverlay)
