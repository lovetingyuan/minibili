import React from 'react'
import Login from './Login'
import Follow from './Follow'

import { useStore } from '../../store'

export default function FollowIndex(props: any) {
  __DEV__ && console.log(111, props.route.name)
  const { $userInfo } = useStore()
  return $userInfo ? <Follow {...props} /> : <Login />
}
