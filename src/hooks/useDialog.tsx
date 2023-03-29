import { Dialog } from '@rneui/base'
import React from 'react'
import type { ReactNode } from 'react'

export default function useDialog(title: string, content?: ReactNode) {
  const [visible, setVisible] = React.useState(false)
  const toggleDialog = (c?: ReactNode) => {
    setVisible(true)
    if (c) {
      setDialogContent(c)
    }
  }
  const [dialogContent, setDialogContent] = React.useState<ReactNode>(content)

  const dialog = (
    <Dialog
      isVisible={visible}
      onBackdropPress={() => setVisible(false)}
      overlayStyle={{ backgroundColor: 'white' }}>
      <Dialog.Title title={title} />
      {dialogContent}
      <Dialog.Actions>
        <Dialog.Button title="OK" onPress={() => setVisible(false)} />
      </Dialog.Actions>
    </Dialog>
  )
  return {
    dialog,
    toggleDialog,
  }
}
