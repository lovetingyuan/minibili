import React, { useEffect, useRef } from 'react'
import { Animated, Easing, type ImageProps, View } from 'react-native'

const RotateImage = (props: ImageProps) => {
  const rotation = useRef(new Animated.Value(0))

  useEffect(() => {
    startRotation()

    return () => {
      stopRotation()
    }
  }, [])

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotation.current, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }

  const stopRotation = () => {
    rotation.current.stopAnimation()
  }

  const interpolatedRotation = rotation.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View className="justify-center items-center flex-1">
      <Animated.Image
        style={[props.style, { transform: [{ rotate: interpolatedRotation }] }]}
        {...props}
      />
    </View>
  )
}

export default RotateImage
