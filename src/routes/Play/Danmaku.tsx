// import React from 'react'
// import { Animated, Easing, useWindowDimensions } from 'react-native'

// const BarrageItem = ({
//   text,
//   speed,
//   onComplete,
// }: {
//   text: string
//   speed: number
//   onComplete?: () => void
// }) => {
//   const { width } = useWindowDimensions()

//   const position = React.useRef(new Animated.Value(width)).current

//   const startAnimation = () => {
//     position.setValue(width)
//     Animated.timing(position, {
//       toValue: -5,
//       duration: speed,
//       easing: Easing.linear,
//       useNativeDriver: true,
//     }).start(onComplete)
//   }

//   React.useEffect(() => {
//     startAnimation()
//   }, [])

//   return (
//     <Animated.Text
//       onPress={() => {
//         position.stopAnimation()
//         startAnimation()
//       }}
//       style={[
//         {
//           position: 'absolute',
//           fontSize: 16,
//           color: 'white',
//           backgroundColor: 'rgba(0, 0, 0, 0.5)',
//           padding: 5,
//           borderRadius: 5,
//           borderWidth: 1,
//           top: 30,
//         },
//         {
//           transform: [
//             {
//               translateX: position,
//             },
//           ],
//         },
//       ]}>
//       {text}
//     </Animated.Text>
//   )
// }
// function Danmaku(props: { cid: number | string }) {
//   return <BarrageItem text={`测试弹幕 ${props.cid}`} speed={4000} />
// }

// export default React.memo(Danmaku)
