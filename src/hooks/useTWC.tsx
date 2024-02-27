import React from 'react'

function Tw(props: { className: string }) {
  return props.className
}

export function useTWC(classes: string) {
  const ele = <Tw className={classes} />
  return ele.props.style
}

// export function useTWC2() {
//   return (classes: string) => {
//     const ele = <Tw className={classes} />
//     return ele.props.style
//   }
// }
