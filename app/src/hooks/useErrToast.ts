import React from 'react'

import { showToast } from '../utils'

export default function useErrToast(msg: string, error: any) {
  React.useEffect(() => {
    if (error) {
      showToast(msg)
    }
  }, [error, msg])
}
