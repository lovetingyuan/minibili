import React from 'react'
import { Modal } from 'react-native'

const Modal2 = ((props: any) => {
  return <Modal {...props} statusBarTranslucent />
}) as unknown as typeof Modal

export default Modal2
