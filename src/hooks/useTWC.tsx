import React from 'react'

function Tw(props: { className: string }) {
  return props.className
}

export default function useTWC(classes: string) {
  const ele = <Tw className={classes} />
  return ele.props.style
}
