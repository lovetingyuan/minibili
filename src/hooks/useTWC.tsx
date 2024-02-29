import React from 'react'

function Tw(props: { className: string }) {
  return props.className
}

export function useTWC(classes: string) {
  const ele = <Tw className={classes} />
  return ele.props.style
}

// export function useTWC2() {
//   const ele = <Tw className={'flex-1'} />
//   return (classes: string) => {
//     const tw(classes)
//   }
// }
