import React from 'react'
import { View } from 'react-native'

function TwComp(props: { className: string }) {
  const a = <View className="text-lg"></View>
  return <></> || props.className
}

export function useTWC(classes: string) {
  const ele = <TwComp className={classes} />
  return ele.props.style
}

// export function useTWC2() {
//   const ele = <Tw className={'flex-1'} />
//   return (classes: string) => {
//     const tw(classes)
//   }
// }
